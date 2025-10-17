import express, { response } from "express";
import bodyparser from "json-body-parser";
import dotenv from "dotenv";
import mysql2 from "mysql2";
import { GoogleGenerativeAI } from "@google/generative-ai";
import jwt from "jsonwebtoken";
import OpenAI from "openai";
import { Server } from "socket.io";
import { createServer } from "http";
import { error } from "console";

// const openai = new OpenAI();

// async function main() {
//     const completion = await openai.chat.completions.create({
//       messages: [{ role: "system", content: "You are a helpful assistant." }],
//       model: "gpt-4o-mini",
//     });

//     console.log(completion.choices[0]);
//   }

//   main();

// const { GoogleGenerativeAI } = require("@google/generative-ai");

// configure env files
dotenv.config();

const jwtKey = process.env.JWT_SECRET || "aanv";

//configure mysql database
console.log("🔍 Environment variables check:");
console.log(
  "DATABASE_URL:",
  process.env.DATABASE_URL ? "✅ Set" : "❌ Not set"
);
console.log("MYSQLHOST:", process.env.MYSQLHOST || "Not set");
console.log("MYSQL_DATABASE:", process.env.MYSQL_DATABASE || "Not set");
console.log(
  "MYSQL_PUBLIC_URL:",
  process.env.MYSQL_PUBLIC_URL ? "✅ Set" : "❌ Not set"
);
console.log("MYSQLUSER:", process.env.MYSQLUSER || "Not set");
console.log(
  "MYSQLPASSWORD:",
  process.env.MYSQLPASSWORD ? "✅ Set" : "❌ Not set"
);
console.log("MYSQL_URL:", process.env.MYSQL_URL ? "✅ Set" : "❌ Not set");
console.log("NODE_ENV:", process.env.NODE_ENV || "Not set");

// Debug: Show all MySQL-related environment variables
console.log("🔍 All MySQL environment variables:");
Object.keys(process.env)
  .filter((key) => key.includes("MYSQL") || key.includes("DATABASE"))
  .forEach((key) => {
    console.log(`  ${key}: ${process.env[key] ? "✅ Set" : "❌ Not set"}`);
  });

let dbConfig;

if (process.env.DATABASE_URL) {
  console.log("📡 Using DATABASE_URL for database connection");
  // Railway provides DATABASE_URL in format: mysql://user:password@host:port/database
  const url = new URL(process.env.DATABASE_URL);
  dbConfig = {
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1), // Remove leading slash
    port: url.port || 3306,
  };
} else {
  console.log(
    "📡 Using Railway MySQL environment variables for database connection"
  );

  // Try different MySQL URL formats in order of preference
  const mysqlUrl = process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL;

  if (mysqlUrl) {
    console.log("📡 Using MySQL URL for database connection");
    try {
      const url = new URL(mysqlUrl);
      dbConfig = {
        host: url.hostname,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
        port: url.port || 3306,
      };
    } catch (error) {
      console.log(
        "❌ Failed to parse MySQL URL, falling back to individual variables"
      );
      dbConfig = {
        host: process.env.MYSQLHOST || "localhost",
        user: process.env.MYSQLUSER || "root",
        password: process.env.MYSQLPASSWORD,
        database:
          process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || "codesync",
        port: process.env.MYSQLPORT || 3306,
      };
    }
  } else {
    // Use Railway MySQL environment variables
    console.log("📡 Using individual MySQL environment variables");
    dbConfig = {
      host: process.env.MYSQLHOST || "localhost",
      user: process.env.MYSQLUSER || "root",
      password: process.env.MYSQLPASSWORD,
      database:
        process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || "codesync",
      port: process.env.MYSQLPORT || 3306,
    };
  }
}

console.log("🗄️ Database config:", {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
});

const db = mysql2.createConnection(dbConfig);

// Handle database connection errors
db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    console.error("Error code:", err.code);
    console.error("Database config:", {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port,
    });

    // Provide helpful error messages
    if (err.code === "ENOTFOUND") {
      console.error("💡 DNS resolution failed. This usually means:");
      console.error(
        "   1. The MySQL service is not properly connected to your app"
      );
      console.error("   2. The hostname is incorrect");
      console.error(
        "   3. Try using MYSQL_PUBLIC_URL instead of internal domain"
      );
    } else if (err.code === "ECONNREFUSED") {
      console.error("💡 Connection refused. This usually means:");
      console.error("   1. MySQL service is not running");
      console.error("   2. Wrong port number");
      console.error("   3. Firewall blocking the connection");
    }

    process.exit(1);
  } else {
    console.log("✅ Database connected successfully");
    console.log("Connected to database:", dbConfig.database);
  }
});

// Handle database disconnection
db.on("error", (err) => {
  console.error("Database error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("Attempting to reconnect to database...");
    db.connect();
  } else {
    throw err;
  }
});

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
const port = process.env.PORT || 5000;
const baseURLGlobal = "https://emkc.org/api/v2/piston/execute";
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: "*",
});

// Language configuration for Piston API
const languageConfig = {
  c: {
    language: "c",
    version: "10.2.0",
    aliases: ["gcc"],
    runtime: "gcc",
    fileExtension: "c",
    defaultCode: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  },
  cpp: {
    language: "c++",
    version: "10.2.0",
    aliases: ["g++"],
    runtime: "g++",
    fileExtension: "cpp",
    defaultCode: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
  },
  python: {
    language: "python",
    version: "3.10.0",
    aliases: ["py"],
    runtime: "python",
    fileExtension: "py",
    defaultCode: `print("Hello, World!")`,
  },
  java: {
    language: "java",
    version: "15.0.2",
    aliases: ["java"],
    runtime: "java",
    fileExtension: "java",
    defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  },
};

app.use(bodyparser);

// CORS configuration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

//code starts here

// Get available languages endpoint
app.get("/api/languages", (req, res) => {
  res.json(languageConfig);
});

//socket connections here

const rooms = {};

io.on("connection", (socket) => {
  console.log("new user connected with id as ", socket.id);

  socket.on("message", (message) => {
    io.emit("reply", message);
  });

  socket.on("join", (room, username) => {
    console.log(username + " joined room " + room);

    socket.join(room);

    if (!rooms[room]) {
      rooms[room] = [];
    }

    rooms[room].push(username);
    // console.log(rooms.room);
    console.log(rooms[room]);
    io.in(room).emit("joined", rooms[room]);
  });

  socket.on("collab", (code, room) => {
    socket.to(room).emit("updated", code);
  });

  socket.on("leave", ({ username, room }) => {
    console.log(username + " wants to leave");

    if (rooms[room]) {
      // Remove the user from the room's members list
      rooms[room] = rooms[room].filter((person) => person != username);

      console.log("Updated members list for room:", rooms[room]);

      if (rooms[room].length > 0) {
        // If there are still members in the room, emit the updated member list
        io.in(room).emit("joined", rooms[room]);
      } else {
        // If the room is empty, delete it and emit an empty list
        delete rooms[room];
        io.in(room).emit("joined", []);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("user " + socket.id + " disconnected");
  });
});

//normal requests here

app.post("/api/getfriends", authenticateUser, (req, res) => {
  console.log(
    req.user.userid,
    " wants to get friend with query",
    req.body.query
  );

  const s = "%" + req.body.query + "%";

  db.query(
    "select username, userid from users where username like ? and userid != ? ;",
    [s, req.user.userid],
    (err, resp) => {
      if (err) return console.log(err);

      console.log(resp);
      res.json(resp);
    }
  );
});

app.post("/api/aihelp", (req, res) => {
  try {
    // console.log(req.body.code);

    const language = req.body.language || "c";

    // res.send("I can hear You")

    async function run() {
      // The Gemini 1.5 models are versatile and work with both text-only and multimodal prompts
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      //prompt to send to AI

      const prompt = `"Can you help me with this ${language} code? Dont tell me the answer, just tell me where I could be wrong in the code. If it is correct pls tell me so: ${req.body.code}
        
        here is the problem description:
        ${req.body.description}
        `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // console.log(text);

      res.json({ response: text });
    }

    run();
  } catch (error) {
    console.log(error);
    res.json({ response: "An error occured in the server" });
  }
});

app.post("/api/submitquestion", (req, res) => {
  //submit question

  try {
    const questionData = req.body;
    //console.log(questionData);

    // {
    //     desc: '',
    //     qname: '',
    //     defaultCode: '//enter your default code here \n #include<stdio.h>',
    //     checkBy: 'testcase',
    //     testcases: [
    //       {
    //         no: 0,
    //         op: '',
    //         opType: 'string',
    //         ip: 'ee',
    //         ipType: 'string',
    //         runnercode: 'fffff'
    //       }
    //     ],
    //     funcName: 'ff'
    //   }

    //first add data to questions table
    // Add timer field (in minutes)
    const questionQuery = `insert into questions(qname, description, defcode, checkBy, funcname, solution, qtype, timer) values ( ?, ?, ?, ?, ?, ?, ?, ?);`;
    const qValuesArray = [
      questionData.qname,
      questionData.desc,
      questionData.defaultCode,
      questionData.checkBy,
      questionData.funcName,
      questionData.solution,
      questionData.qtype,
      questionData.timer || 0,
    ];

    db.query(questionQuery, qValuesArray, (err, result) => {
      //insert the question into database
      if (err) {
        throw err;
      }
      // console.log(result);
    });

    var current_question_id = 0;

    if (questionData.checkBy == "testcase") {
      //if the q is checked by testcase, then add it to db

      db.query(
        "select max(q_id) as current_id from questions",
        [],
        (err, result) => {
          // console.log(result[0].current_id);
          current_question_id = result[0].current_id;

          //insert into testcase db

          const testcases = questionData.testcases;
          //    console.log(testcases);

          // +------------+--------------+------+-----+---------+----------------+
          // | Field      | Type         | Null | Key | Default | Extra          |
          // +------------+--------------+------+-----+---------+----------------+
          // | t_id       | int          | NO   | PRI | NULL    | auto_increment |
          // | tno        | int          | YES  |     | NULL    |                |
          // | q_id       | int          | YES  |     | NULL    |                |
          // | runnercode | text         | YES  |     | NULL    |                |
          // | ip         | varchar(100) | YES  |     | NULL    |                |
          // | iptype     | varchar(100) | YES  |     | NULL    |                |
          // | op         | varchar(100) | YES  |     | NULL    |                |
          // | optype     | varchar(100) | YES  |     | NULL    |                |
          // +------------+--------------+------+-----+---------+----------------+

          testcases.forEach((testcase) => {
            const query = `INSERT INTO testcases (tno, q_id, runnercode, ip, iptype, op, optype) VALUES (?, ?, ?, ?, ?, ?, ?);`;

            db.query(
              query,
              [
                testcase.no,
                current_question_id,
                testcase.runnercode,
                testcase.ip,
                testcase.ipType,
                testcase.op,
                testcase.opType,
              ],
              (err, res) => {
                if (err) {
                  console.log("Error inserting testcase:", err);
                  throw err;
                } else {
                  console.log("Inserted testcase:", res);
                }
              }
            );
          });
        }
      );
    }

    //         +-------------+--------------+------+-----+---------+----------------+
    // | Field       | Type         | Null | Key | Default | Extra          |
    // +-------------+--------------+------+-----+---------+----------------+
    // | q_id        | int          | NO   | PRI | NULL    | auto_increment |
    // | qname       | varchar(500) | YES  |     | NULL    |                |
    // | description | text         | YES  |     | NULL    |                |
    // | defcode     | text         | YES  |     | NULL    |                |
    // | checkBy     | varchar(100) | YES  |     | NULL    |                |
    // | funcname    | varchar(100) | YES  |     | NULL    |                |
    // +-------------+--------------+------+-----+---------+----------------+

    const testcases = questionData.testcases;
    // console.log(testcases);

    res.json({ resp: "submitted question" });
  } catch (error) {
    console.log(error);
    res.json({ resp: "An error occurred in server" });
  }
});

app.get("/api/getProblemList/:type", (req, res) => {
  const type = req.params.type;
  // console.log(type);

  let q = "select q_id, qname, qtype from questions where qtype = ?;";

  if (type == "all") {
    q = "select q_id, qname, qtype from questions;";
  }

  db.query(q, [type], (err, resp) => {
    if (err) {
      throw err;
    }

    // console.log(resp);
    res.json(resp);
  });
});

app.get("/api/getprobleminfo/:qid", (req, res) => {
  const qid = req.params.qid;

  // console.log(qid);

  // Include timer in the result
  const q = "select *, timer from questions where q_id = ? ;";

  db.query(q, [qid], (err, result) => {
    if (err) {
      throw err;
    }

    // console.log(result);
    res.json(result);
  });
});

app.post("/api/checktc", async (req, res) => {
  // console.log(req.body.usercode);

  let error = "";
  let wrong_input = "";
  let your_output = "";
  let expected_output = "";
  let usercode = req.body.usercode;
  let language = req.body.language || "c";

  try {
    const result = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM testcases WHERE q_id = ? ;",
        [req.body.qid],
        (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });

    // console.log(result);

    const baseURL = "https://emkc.org/api/v2/piston/execute"; // post

    let status = true;

    // Get language configuration
    const langConfig = languageConfig[language] || languageConfig.c;

    async function testQuestion(testc) {
      // Prepare file content and name based on language
      let fileName = `my_cool_code.${langConfig.fileExtension}`;
      let fileContent = "";
      if (language === "java") {
        // For Java, usercode should be a full class, runnercode may be ignored or appended as a method if needed
        fileContent = usercode; // runnercode is not appended for Java
        // Optionally, parse for class name and set fileName accordingly
        const match = usercode.match(/class\s+(\w+)/);
        if (match) {
          fileName = `${match[1]}.java`;
        }
      } else {
        // For C, C++, Python: append runnercode if present
        fileContent = usercode + (testc.runnercode || "");
      }

      const response = await fetch(baseURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: langConfig.language,
          version: langConfig.version,
          aliases: langConfig.aliases,
          runtime: langConfig.runtime,
          files: [
            {
              name: fileName,
              content: fileContent,
            },
          ],
          stdin: testc.ip || "",
          args: [],
          compile_timeout: 10000,
          run_timeout: 3000,
        }),
      });

      const data = await response.json();

      if (data.run.stderr) {
        error = data.run.stderr;
        status = false;
        return false;
      } else if ((data.run.stdout || "").trim() != (testc.op || "").trim()) {
        your_output = data.run.stdout;
        return false;
      }
      return true;
    }

    // Iterate over each test case with a 300ms delay
    for (const testc of result) {
      const isSuccess = await testQuestion(testc);
      if (!isSuccess) {
        res.json({
          remark: "wrong",
          error: error,
          input: testc.ip,
          expected_output: testc.op,
          your_output: your_output,
        });
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    res.json({ remark: "correct" });
  } catch (error) {
    console.error("Error during database query or execution:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/tcvalid", async (req, res) => {
  // console.log(req.body);

  let language = req.body.language || "c";
  const langConfig = languageConfig[language] || languageConfig.c;

  // Prepare file content and name based on language
  let fileName = `my_cool_code.${langConfig.fileExtension}`;
  let fileContent = req.body.code;
  if (language === "java") {
    // For Java, try to set file name to class name
    const match = req.body.code.match(/class\s+(\w+)/);
    if (match) {
      fileName = `${match[1]}.java`;
    }
  }

  const response = await fetch(baseURLGlobal, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language: langConfig.language,
      version: langConfig.version,
      aliases: langConfig.aliases,
      runtime: langConfig.runtime,
      files: [
        {
          name: fileName,
          content: fileContent,
        },
      ],
      stdin: req.body.ip || "",
      args: [],
      compile_timeout: 10000,
      run_timeout: 3000,
    }),
  });

  const data = await response.json();

  const remark = {};
  remark.status = "invalid";

  if ((data.run.stdout || "").trim() == (req.body.op || "").trim()) {
    remark.status = "valid";
  } else {
    remark.error = data.run.stderr || "Your output:\n" + data.run.stdout;
  }

  res.json(remark);
});

app.get("/api/getTestcases/:qid", (req, res) => {
  const qid = req.params.qid;

  db.query("select * from testcases where q_id = ?", [qid], (err, result) => {
    if (err) {
      res.json({ error: err });
      return;
    }

    res.json(result);
  });
});

app.post("/api/solved", (req, res) => {
  const userid = req.body.userid;
  const qid = req.body.qid;

  db.query(
    "insert into solved(q_id, user_id) values (? , ?);",
    [qid, userid],
    (err, result) => {
      if (err) {
        res.json({ error: err });
        return;
      }

      res.json({ status: "added" });
    }
  );
});

app.post("/api/checksolved", authenticateUser, (req, res) => {
  const userid = req.user.userid;
  const qid = req.body.qid;

  // console.log(req.body);

  db.query(
    "select * from solved where q_id = ? and user_id = ? ;",
    [qid, userid],
    (err, result) => {
      if (err) {
        res.json({ error: err });
        return;
      }

      if (result.length === 0) {
        res.json({ status: false, userid: userid });
        return;
      }
      res.json({ status: true });
    }
  );
});

app.post("/api/checkbyai", (req, res) => {
  // console.log(req.body);

  const desc = req.body.desc;
  const code = req.body.code;
  const language = req.body.language || "c";

  const prompt = `You are an instructor who will check a user written code. If the user written code is correct and should execute, just say 'pass' . Else if there is any minor or major mistake, say 'fail'.  
    here is the question 
    ${desc}
    Here is the ${language} code written by user : ${code}`;

  try {
    async function run() {
      // The Gemini 1.5 models are versatile and work with both text-only and multimodal prompts
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      //prompt to send to AI

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // console.log(text);

      if (text.includes("pass")) {
        const userid = req.body.userid;
        const qid = req.body.qid;

        db.query(
          "insert into solved(q_id, user_id) values (? , ?);",
          [qid, userid],
          (err, result) => {
            if (err) {
              res.json({ error: err });
              return;
            }
            console.log("added to db");
          }
        );
      }
      res.json({ response: text });
    }

    run();
  } catch (error) {
    console.log(error);
    res.json({ response: "An error occured in the server" });
  }
});

app.post("/api/getSolvedProblems", authenticateUser, async (req, res) => {
  const userid = req.user.userid;
  // console.log(userid);

  db.query(
    "select * from solved where user_id = ?",
    [userid],
    (err, result) => {
      if (err) {
        res.json({ error: err });
      }

      // console.log(result);

      const finalQids = [];

      result.forEach((el) => {
        finalQids.push(el.q_id);
      });

      // console.log(finalQids);

      res.json({ quids: finalQids });
    }
  );
});

app.post("/api/signup", (req, res) => {
  // console.log(req.body);

  let data = [req.body.name, req.body.email, req.body.password];

  let q = "insert into users(username , email, password) values (? , ? , ?) ; ";

  db.query(q, data, (error, response) => {
    if (error) {
      console.log(error);
      res.json({ message: "failure" });
    }

    // console.log(response);
    res.json({ message: "success" });
  });
});

app.post("/api/login", async (req, res) => {
  let data = [req.body.email, req.body.password];

  // console.log(req.body);

  //check database

  let q = "select * from users where email = ? and password = ? ;";

  db.query(q, data, (error, response) => {
    if (error) {
      console.log(error);
      res.json({ message: false });
    }

    // console.log("len is "+ response.length);
    // console.log(response);

    if (response.length === 0) {
      res.json({ message: false });
    } else {
      //user is authenticated
      const username = response[0].username;
      const userid = response[0].userid;
      const role = response[0].role;

      const tokenData = {
        username: username,
        userid: userid,
        role: role,
      };

      // console.log(tokenData);

      const accessToken = jwt.sign(tokenData, "aanv");

      res.json({ message: true, accessToken: accessToken });
    }
  });
});

app.get("/api/getleaders", authenticateUser, (req, res) => {
  // select u.username, s.user_id, count(distinct s.q_id) as question_count from solved s join users u on s.user_id = u.userid group by u.userid order by question_count desc;

  db.query(
    `SELECT u.username, 
       u.userid, 
       COALESCE(COUNT(DISTINCT s.q_id), 0) AS question_count
FROM users u
LEFT JOIN solved s ON u.userid = s.user_id
GROUP BY u.userid
ORDER BY question_count DESC;
`,
    [],
    (err, response) => {
      if (err) return res.status(400);

      const data = {};
      data.leaders = response;
      data.me = req.user.userid;
      // console.log(data);

      res.json(data);
    }
  );
});

function authenticateUser(req, res, next) {
  // const authToken = req.body.authToken
  const authHeader = req.headers["authorization"];
  const authToken = authHeader.split(" ")[1];
  // console.log("Auth token is "+authToken);

  if (authToken) {
    jwt.verify(authToken, jwtKey, (error, user) => {
      if (error) return res.sendStatus(401);
      req.user = user;
      next();
    });
  }
}

app.post("/api/getUserInfo", authenticateUser, (req, res) => {
  // console.log(req.user);

  res.json({ data: req.user });
});

app.post("/api/searchUser", (req, res) => {
  const { query, userid } = req.body;

  const q = "select username, userid, role from users where username = ?;";
  db.query(q, [query], (err, result) => {
    if (err) {
      res.status(500);
    }
    const newArray = result.filter((person) => {
      return person.userid != userid;
    });
    // console.log(newArray);
    res.json(newArray);
  });
});

app.post("/api/makeAdmin", authenticateUser, (req, res) => {
  // console.log("admin");
  // console.log(req.body.id);

  db.query(
    "update users set role = ? where userid = ?",
    ["admin", req.body.id],
    (err, result) => {
      if (err) return res.json({ staus: false });
      res.json({ status: true });
    }
  );
});

app.get("/api/getprofileInfo", authenticateUser, (req, res) => {
  //no of solved
  //total questions
  //username

  // res.json({message:"Hello"})
  // console.log(req.user.userid);

  // return

  const q =
    "select u.username, u.email, u.role, (select count(distinct q_id) from solved s where s.user_id = ?) as solved, (select count(q.q_id) from questions q) as total from users u where userid = ?;";

  db.query(q, [req.user.userid, req.user.userid], (err, result) => {
    if (err) return res.status(500);
    // console.log(result);

    res.json(result);
  });
});

//select distinct s.q_id, u.username,u.userid, q.qtype from users u left join solved s on u.userid = s.user_id left join questions q on s.q_id = q.q_id;

// select qtype, count(qtype) from (select distinct s.q_id, u.username, u.userid, q.qtype from users u left join solved s on u.userid = s.user_id left join questions q on s.q_id = q.q_id) as subquery where userid = 9 group by qtype;

// select qtype, count(qtype) from (select distinct s.q_id, u.username, u.userid, q.qtype from users u left join solved s on u.userid = s.user_id left join questions q on s.q_id = q.q_id) as subquery where userid = 10 group by qtype;

// select subquery.qtype, count(subquery.qtype) as usercount, total.qcount from (select distinct s.q_id, u.username, u.userid, q.qtype from users u left join solved s on u.userid = s.user_id left join questions q on s.q_id = q.q_id where userid = 9) as subquery join (select q.qtype, count(q.qtype) as qcount from questions q group by q.qtype) as total on subquery.qtype = total.qtype group by subquery.qtype, total.qcount;

// SELECT COALESCE(subquery.qtype, total.qtype) AS qtype,
//        COUNT(subquery.qtype) AS usercount,
//        total.qcount
// FROM (
//     SELECT DISTINCT s.q_id, u.userid, q.qtype
//     FROM users u
//     LEFT JOIN solved s ON u.userid = s.user_id
//     LEFT JOIN questions q ON s.q_id = q.q_id
//     WHERE u.userid = 2
// ) AS subquery
// RIGHT JOIN (
//     SELECT q.qtype, COUNT(q.qtype) AS qcount
//     FROM questions q
//     GROUP BY q.qtype
// ) AS total
// ON subquery.qtype = total.qtype
// GROUP BY COALESCE(subquery.qtype, total.qtype), total.qcount;

app.get("/api/getchartinfo", authenticateUser, (req, res) => {
  const q = `SELECT COALESCE(subquery.qtype, total.qtype) AS qtype, 
       COUNT(subquery.qtype) AS usercount, 
       total.qcount
FROM (
    SELECT DISTINCT s.q_id, u.userid, q.qtype
    FROM users u
    LEFT JOIN solved s ON u.userid = s.user_id
    LEFT JOIN questions q ON s.q_id = q.q_id
    WHERE u.userid = ?
) AS subquery
RIGHT JOIN (
    SELECT q.qtype, COUNT(q.qtype) AS qcount
    FROM questions q
    GROUP BY q.qtype
) AS total
ON subquery.qtype = total.qtype
GROUP BY COALESCE(subquery.qtype, total.qtype), total.qcount;`;

  db.query(q, [req.user.userid], (err, result) => {
    if (err) return res.status(500);

    res.json(result);
  });
});

app.get("/api/getuseless", (req, res) => {
  const q =
    "select u.username from users u left join solved s on u.userid = s.user_id where s.q_id is null;";

  db.query(q, [], (err, result) => {
    if (err) {
      console.log(err);
    }

    res.json(result);
  });
});

app.get("/api/deleteproblem/:qid", authenticateUser, (req, res) => {
  if (req.user.role === "admin") {
    console.log("delete " + req.params.qid);
    const qid = req.params.qid;

    try {
      const q = "delete from questions where q_id = ?";

      db.query(q, [qid], (err, result) => {
        if (err) return res.json({ status: "error", message: err });

        return res.json({ status: "success" });
      });
    } catch (error) {
      res.json({ status: "error", message: err });
    }

    //db.query
  }
});

// app.listen(port, ()=>{
//     console.log("App is listening at port "+port);
// })

// Serve static frontend in production
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// SPA fallback: send index.html for unknown routes (non-API)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(publicDir, "index.html"));
});

httpServer.listen(port, () => {
  console.log("http server up at ", port);
});
