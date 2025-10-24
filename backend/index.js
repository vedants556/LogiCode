import express, { response } from "express";
import bodyparser from "json-body-parser";
import dotenv from "dotenv";
import mysql2 from "mysql2";
import { GoogleGenerativeAI } from "@google/generative-ai";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { createServer } from "http";
import { error } from "console";
import {
  strictRateLimiter,
  proctoringRateLimiter,
  standardRateLimiter,
  speedLimiter,
  batchProctoringEvent,
  startBatchFlushing,
  isDuplicateEvent,
  blockSuspiciousUsers,
  validateRequestSize,
  validateCodeSubmission,
  getSecurityStats,
  startPeriodicCleanup,
} from "./security-middleware.js";

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

// Function to resolve Railway template variables
function resolveRailwayTemplate(value) {
  if (!value || typeof value !== "string") return value;

  // Check if it contains Railway template syntax
  if (value.includes("${{")) {
    console.log(`⚠️  Template variable detected: ${value}`);
    console.log(
      `💡 This suggests you're running locally but with Railway environment variables.`
    );
    console.log(
      `💡 Please set up your local .env file with actual database credentials.`
    );
    return null; // Return null to indicate template variable
  }

  return value;
}

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

    // Check if URL contains template variables
    const resolvedUrl = resolveRailwayTemplate(mysqlUrl);
    if (resolvedUrl === null) {
      console.log(
        "❌ Railway template variables detected in MySQL URL. Cannot connect to database."
      );
      console.log(
        "💡 Please set up your local .env file with actual database credentials."
      );
      process.exit(1);
    }

    try {
      const url = new URL(resolvedUrl);
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

      // Resolve template variables for individual variables too
      const resolvedHost = resolveRailwayTemplate(process.env.MYSQLHOST);
      const resolvedDatabase = resolveRailwayTemplate(
        process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE
      );

      if (resolvedHost === null || resolvedDatabase === null) {
        console.log(
          "❌ Railway template variables detected. Cannot connect to database."
        );
        console.log(
          "💡 Please set up your local .env file with actual database credentials."
        );
        process.exit(1);
      }

      dbConfig = {
        host: resolvedHost || "localhost",
        user: process.env.MYSQLUSER || "root",
        password: process.env.MYSQLPASSWORD,
        database: resolvedDatabase || "codesync",
        port: process.env.MYSQLPORT || 3306,
      };
    }
  } else {
    // Use Railway MySQL environment variables
    console.log("📡 Using individual MySQL environment variables");

    // Resolve template variables
    const resolvedHost = resolveRailwayTemplate(process.env.MYSQLHOST);
    const resolvedDatabase = resolveRailwayTemplate(
      process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE
    );

    // Check if we have template variables
    if (resolvedHost === null || resolvedDatabase === null) {
      console.log(
        "❌ Railway template variables detected. Cannot connect to database."
      );
      console.log(
        "💡 Please set up your local .env file with actual database credentials."
      );
      console.log(
        "💡 Or use Railway CLI to get the actual connection details."
      );
      process.exit(1);
    }

    dbConfig = {
      host: resolvedHost || "localhost",
      user: process.env.MYSQLUSER || "root",
      password: process.env.MYSQLPASSWORD,
      database: resolvedDatabase || "codesync",
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

// Test endpoint to check database schema
app.get("/api/test-schema", (req, res) => {
  const testQuery = "DESCRIBE questions";
  db.query(testQuery, (err, result) => {
    if (err) {
      console.log("Error checking schema:", err);
      return res.status(500).json({ error: "Schema check failed" });
    }
    res.json({ schema: result, message: "Schema check successful" });
  });
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
    // Add timer field (in minutes) and multi-language support
    const questionQuery = `insert into questions(qname, description, defcode, checkBy, funcname, solution, qtype, timer, selected_languages, language_templates, language_solutions) values ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
    const qValuesArray = [
      questionData.qname,
      questionData.desc,
      questionData.defaultCode,
      questionData.checkBy,
      questionData.funcName,
      questionData.solution,
      questionData.qtype,
      questionData.timer || 0,
      JSON.stringify(questionData.selectedLanguages || []),
      JSON.stringify(questionData.languageTemplates || {}),
      JSON.stringify(questionData.languageSolutions || {}),
    ];

    db.query(questionQuery, qValuesArray, (err, result) => {
      //insert the question into database
      if (err) {
        console.log("Database error inserting question:", err);
        return res.status(500).json({ resp: "Database error occurred" });
      }
      console.log("Question inserted successfully:", result);
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
            const query = `INSERT INTO testcases (tno, q_id, runnercode, ip, iptype, op, optype, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`;

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
                testcase.language || "c", // Default to 'c' if language not specified
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

  // Include timer and multi-language support in the result
  // Use a more robust query that handles missing columns gracefully
  const q = "select * from questions where q_id = ? ;";

  db.query(q, [qid], (err, result) => {
    if (err) {
      console.log("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Parse JSON fields for multi-language support
    if (result.length > 0) {
      try {
        // Handle NULL values and parse JSON with better error handling
        // Check if columns exist (for backward compatibility)
        if (result[0].hasOwnProperty("selected_languages")) {
          result[0].selected_languages = result[0].selected_languages
            ? JSON.parse(result[0].selected_languages)
            : ["c"];
        } else {
          result[0].selected_languages = ["c"];
        }

        if (result[0].hasOwnProperty("language_templates")) {
          result[0].language_templates = result[0].language_templates
            ? JSON.parse(result[0].language_templates)
            : {};
        } else {
          result[0].language_templates = {};
        }

        if (result[0].hasOwnProperty("language_solutions")) {
          result[0].language_solutions = result[0].language_solutions
            ? JSON.parse(result[0].language_solutions)
            : {};
        } else {
          result[0].language_solutions = {};
        }
      } catch (parseError) {
        console.log("Error parsing multi-language data:", parseError);
        // Set defaults if parsing fails
        result[0].selected_languages = ["c"];
        result[0].language_templates = {};
        result[0].language_solutions = {};
      }
    }

    // console.log(result);
    res.json(result);
  });
});

// Run test cases (like leetcode - shows all results without submitting)
// WITH STRICT RATE LIMITING - 10 runs per minute
app.post(
  "/api/runtestcases",
  strictRateLimiter, // Rate limit: 10 per minute
  speedLimiter, // Gradually slow down rapid requests
  validateRequestSize(1024 * 1024), // Max 1MB request
  validateCodeSubmission, // Validate code for malicious patterns
  async (req, res) => {
    const { usercode, qid, language } = req.body;

    try {
      // Get test cases from database filtered by language
      const testcases = await new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM testcases WHERE q_id = ? AND language = ?",
          [qid, language],
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
      });

      if (!testcases || testcases.length === 0) {
        return res.json({ error: "No test cases found for this problem" });
      }

      const baseURL = "https://emkc.org/api/v2/piston/execute";
      const langConfig = languageConfig[language] || languageConfig.c;
      const results = [];

      // Run code against each test case
      for (const testc of testcases) {
        let fileName = `my_cool_code.${langConfig.fileExtension}`;
        let fileContent = "";

        if (language === "java") {
          fileContent = usercode;
          const match = usercode.match(/class\s+(\w+)/);
          if (match) {
            fileName = `${match[1]}.java`;
          }
        } else {
          // Combine user code with runner code
          fileContent = usercode + "\n" + (testc.runnercode || "");
        }

        try {
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
          const actualOutput = (data.run.stdout || "").trim();
          const expectedOutput = (testc.op || "").trim();

          results.push({
            input: testc.ip,
            expected: expectedOutput,
            actual: actualOutput,
            passed: actualOutput === expectedOutput && !data.run.stderr,
            error: data.run.stderr || data.compile?.stderr || null,
            // ✅ Performance metrics from Piston
            performance: {
              cpu_time: data.run?.cpu_time || 0,
              wall_time: data.run?.wall_time || 0,
              memory: data.run?.memory || 0,
              memory_mb: ((data.run?.memory || 0) / 1024 / 1024).toFixed(2),
            },
          });

          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (err) {
          results.push({
            input: testc.ip,
            expected: testc.op,
            actual: "",
            passed: false,
            error: "Execution failed: " + err.message,
            performance: {
              cpu_time: 0,
              wall_time: 0,
              memory: 0,
              memory_mb: "0.00",
            },
          });
        }
      }

      res.json({ results });
    } catch (error) {
      console.error("Error running test cases:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Check test cases and submit solution
// WITH STRICT RATE LIMITING - 10 submissions per minute
app.post(
  "/api/checktc",
  strictRateLimiter, // Rate limit: 10 per minute
  speedLimiter, // Gradually slow down rapid requests
  validateRequestSize(1024 * 1024), // Max 1MB request
  validateCodeSubmission, // Validate code for malicious patterns
  async (req, res) => {
    // console.log(req.body.usercode);

    let error = "";
    let wrong_input = "";
    let your_output = "";
    let expected_output = "";
    let usercode = req.body.usercode;
    let language = req.body.language || "c";
    let performanceMetrics = []; // ✅ Track performance across test cases

    try {
      const result = await new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM testcases WHERE q_id = ? AND language = ? ;",
          [req.body.qid, language],
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
          // For C, C++, Python: append runnercode if present with proper line breaks
          fileContent = usercode + "\n" + (testc.runnercode || "");
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

        // ✅ Collect performance metrics for successful runs
        performanceMetrics.push({
          cpu_time: data.run?.cpu_time || 0,
          wall_time: data.run?.wall_time || 0,
          memory: data.run?.memory || 0,
        });

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

      // ✅ Calculate average performance metrics
      let avgMetrics = null;
      if (performanceMetrics.length > 0) {
        avgMetrics = {
          avg_cpu_time: Math.round(
            performanceMetrics.reduce((sum, m) => sum + m.cpu_time, 0) /
              performanceMetrics.length
          ),
          avg_wall_time: Math.round(
            performanceMetrics.reduce((sum, m) => sum + m.wall_time, 0) /
              performanceMetrics.length
          ),
          avg_memory: Math.round(
            performanceMetrics.reduce((sum, m) => sum + m.memory, 0) /
              performanceMetrics.length
          ),
          max_memory: Math.max(...performanceMetrics.map((m) => m.memory)),
          total_time: performanceMetrics.reduce(
            (sum, m) => sum + m.wall_time,
            0
          ),
          memory_mb: (
            Math.max(...performanceMetrics.map((m) => m.memory)) /
            1024 /
            1024
          ).toFixed(2),
          test_cases: performanceMetrics.length,
        };
      }

      res.json({ remark: "correct", performance: avgMetrics });
    } catch (error) {
      console.error("Error during database query or execution:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.post("/api/tcvalid", async (req, res) => {
  try {
    const { solutionCode, runnerCode, expectedOutput, input, language } =
      req.body;

    if (!solutionCode || !runnerCode || !expectedOutput || !language) {
      return res.json({
        status: "invalid",
        error:
          "Missing required fields: solutionCode, runnerCode, expectedOutput, or language",
      });
    }

    const lang = language || "c";
    const langConfig = languageConfig[lang] || languageConfig.c;

    // Combine solution code and runner code properly based on language
    let fileContent = "";
    let fileName = `my_cool_code.${langConfig.fileExtension}`;

    if (lang === "python") {
      // Python: Just concatenate with double newline
      fileContent = solutionCode + "\n\n" + runnerCode;
    } else if (lang === "java") {
      // Java: Runner code should include the class with the method
      fileContent = solutionCode;
      // Try to extract class name for proper file naming
      const classMatch = solutionCode.match(/public\s+class\s+(\w+)/);
      if (classMatch) {
        fileName = `${classMatch[1]}.java`;
      }
    } else if (lang === "c" || lang === "cpp") {
      // C/C++: Concatenate solution and runner
      fileContent = solutionCode + "\n\n" + runnerCode;
    } else {
      // Default behavior
      fileContent = solutionCode + "\n\n" + runnerCode;
    }

    // Execute the code
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
        stdin: input || "",
        args: [],
        compile_timeout: 10000,
        run_timeout: 3000,
      }),
    });

    const data = await response.json();

    // Check for compilation errors
    if (data.compile && data.compile.stderr) {
      return res.json({
        status: "invalid",
        compilationError: data.compile.stderr,
      });
    }

    // Check for runtime errors
    if (data.run && data.run.stderr) {
      return res.json({
        status: "invalid",
        error: data.run.stderr,
      });
    }

    // Get actual output
    const actualOutput =
      data.run && data.run.stdout ? data.run.stdout.trim() : "";
    const expected = expectedOutput.trim();

    // Compare outputs
    if (actualOutput === expected) {
      return res.json({
        status: "valid",
        actualOutput: actualOutput,
        expectedOutput: expected,
      });
    } else {
      return res.json({
        status: "invalid",
        mismatch: true,
        actualOutput: actualOutput,
        expectedOutput: expected,
      });
    }
  } catch (error) {
    console.error("Error in /api/tcvalid:", error);
    return res.json({
      status: "invalid",
      error: "Server error: " + error.message,
    });
  }
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

  // First check if already solved to prevent duplicates
  db.query(
    "SELECT * FROM solved WHERE q_id = ? AND user_id = ?",
    [qid, userid],
    (err, result) => {
      if (err) {
        res.json({ error: err });
        return;
      }

      if (result.length > 0) {
        // Already solved, don't insert duplicate
        res.json({ status: "already_solved" });
        return;
      }

      // Not solved yet, insert new record
      db.query(
        "INSERT INTO solved(q_id, user_id) VALUES (?, ?)",
        [qid, userid],
        (err, result) => {
          if (err) {
            res.json({ error: err });
            return;
          }

          res.json({ status: "added" });
        }
      );
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

        // Check if already solved before inserting
        db.query(
          "SELECT * FROM solved WHERE q_id = ? AND user_id = ?",
          [qid, userid],
          (err, checkResult) => {
            if (err) {
              console.log("Error checking solved status:", err);
              return;
            }

            if (checkResult.length === 0) {
              // Not solved yet, insert new record
              db.query(
                "INSERT INTO solved(q_id, user_id) VALUES (?, ?)",
                [qid, userid],
                (err, result) => {
                  if (err) {
                    console.log("Error inserting solved record:", err);
                    return;
                  }
                  console.log("added to db");
                }
              );
            } else {
              console.log("already solved, skipping insert");
            }
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
WHERE (u.role IS NULL OR (u.role != 'teacher' AND u.role != 'admin'))
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

// ==================== PROCTORING ENDPOINTS ====================

// Middleware to check if user is a teacher
function isTeacher(req, res, next) {
  if (req.user.role === "teacher" || req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Teacher role required." });
  }
}

// Log proctoring event - WITH RATE LIMITING AND BATCHING
app.post(
  "/api/proctoring/log-event",
  authenticateUser,
  proctoringRateLimiter, // Rate limit: 30 events per minute
  blockSuspiciousUsers, // Block users with too many violations
  async (req, res) => {
    try {
      const { q_id, event_type, event_details, severity } = req.body;
      const user_id = req.user.userid;

      // Check for duplicate events (within 1 second)
      if (isDuplicateEvent(user_id, event_type, event_details)) {
        // Silent success - don't log duplicate
        return res.json({ success: true, deduplicated: true });
      }

      // Use event batching instead of immediate insert
      // This reduces database writes by 10-20x
      batchProctoringEvent(user_id, q_id, event_type, event_details, severity);

      // Emit real-time event to teachers via WebSocket (but throttled)
      // Only emit high and medium severity events to reduce WebSocket spam
      if (severity === "high" || severity === "medium") {
        io.emit("proctoring_event", {
          user_id,
          username: req.user.username,
          q_id,
          event_type,
          event_details,
          severity,
          timestamp: new Date(),
        });
      }

      res.json({ success: true, batched: true });
    } catch (error) {
      console.error("Error in log-event:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Start/update active session - WITH RATE LIMITING
app.post(
  "/api/proctoring/session",
  authenticateUser,
  standardRateLimiter, // 100 requests per minute
  async (req, res) => {
    try {
      const { q_id, problem_name, language } = req.body;
      const user_id = req.user.userid;
      const username = req.user.username;

      // Check if session already exists
      db.query(
        "SELECT * FROM active_sessions WHERE user_id = ? AND q_id = ? AND is_active = TRUE",
        [user_id, q_id],
        (err, existing) => {
          if (err) {
            console.error("Error checking session:", err);
            return res.status(500).json({ error: "Failed to check session" });
          }

          if (existing.length > 0) {
            // Update existing session
            db.query(
              "UPDATE active_sessions SET last_activity = CURRENT_TIMESTAMP, language = ? WHERE session_id = ?",
              [language, existing[0].session_id],
              (err, result) => {
                if (err) {
                  console.error("Error updating session:", err);
                  return res
                    .status(500)
                    .json({ error: "Failed to update session" });
                }
                res.json({ success: true, session_id: existing[0].session_id });
              }
            );
          } else {
            // Create new session
            db.query(
              `INSERT INTO active_sessions (user_id, username, q_id, problem_name, language) 
             VALUES (?, ?, ?, ?, ?)`,
              [user_id, username, q_id, problem_name, language],
              (err, result) => {
                if (err) {
                  console.error("Error creating session:", err);
                  return res
                    .status(500)
                    .json({ error: "Failed to create session" });
                }

                // Emit to teachers
                io.emit("user_session_started", {
                  user_id,
                  username,
                  q_id,
                  problem_name,
                  language,
                });

                res.json({ success: true, session_id: result.insertId });
              }
            );
          }
        }
      );
    } catch (error) {
      console.error("Error in session endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// End session
app.post("/api/proctoring/end-session", authenticateUser, async (req, res) => {
  try {
    const { q_id } = req.body;
    const user_id = req.user.userid;

    db.query(
      "UPDATE active_sessions SET is_active = FALSE WHERE user_id = ? AND q_id = ? AND is_active = TRUE",
      [user_id, q_id],
      (err, result) => {
        if (err) {
          console.error("Error ending session:", err);
          return res.status(500).json({ error: "Failed to end session" });
        }

        io.emit("user_session_ended", {
          user_id,
          username: req.user.username,
          q_id,
        });
        res.json({ success: true });
      }
    );
  } catch (error) {
    console.error("Error in end-session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// End all user sessions (for logout)
app.post(
  "/api/proctoring/end-all-sessions",
  authenticateUser,
  async (req, res) => {
    try {
      const user_id = req.user.userid;

      db.query(
        "UPDATE active_sessions SET is_active = FALSE WHERE user_id = ? AND is_active = TRUE",
        [user_id],
        (err, result) => {
          if (err) {
            console.error("Error ending all sessions:", err);
            return res.status(500).json({ error: "Failed to end sessions" });
          }

          io.emit("user_logged_out", {
            user_id,
            username: req.user.username,
          });

          res.json({ success: true, sessions_ended: result.affectedRows });
        }
      );
    } catch (error) {
      console.error("Error in end-all-sessions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update session activity counter (tab switches, copy/paste) - WITH RATE LIMITING
app.post(
  "/api/proctoring/update-counter",
  authenticateUser,
  proctoringRateLimiter, // 30 requests per minute
  async (req, res) => {
    try {
      const { q_id, counter_type } = req.body;
      const user_id = req.user.userid;

      const column =
        counter_type === "tab_switch" ? "tab_switches" : "copy_paste_count";

      db.query(
        `UPDATE active_sessions 
       SET ${column} = ${column} + 1, last_activity = CURRENT_TIMESTAMP 
       WHERE user_id = ? AND q_id = ? AND is_active = TRUE`,
        [user_id, q_id],
        (err, result) => {
          if (err) {
            console.error("Error updating counter:", err);
            return res.status(500).json({ error: "Failed to update counter" });
          }
          res.json({ success: true });
        }
      );
    } catch (error) {
      console.error("Error in update-counter:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Submit code for plagiarism checking
app.post("/api/proctoring/submit-code", authenticateUser, async (req, res) => {
  try {
    const { q_id, code, language } = req.body;
    const user_id = req.user.userid;

    db.query(
      "INSERT INTO code_submissions (user_id, q_id, code, language) VALUES (?, ?, ?, ?)",
      [user_id, q_id, code, language],
      (err, result) => {
        if (err) {
          console.error("Error submitting code:", err);
          return res.status(500).json({ error: "Failed to submit code" });
        }
        res.json({ success: true, submission_id: result.insertId });
      }
    );
  } catch (error) {
    console.error("Error in submit-code:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Teacher Dashboard: Get all active sessions
app.get(
  "/api/teacher/active-sessions",
  authenticateUser,
  isTeacher,
  (req, res) => {
    // Only show sessions active in the last 5 minutes for real-time accuracy
    db.query(
      `SELECT 
        s.session_id, s.user_id, s.username, s.q_id, s.problem_name, s.language,
        s.tab_switches, s.copy_paste_count, s.is_active,
        DATE_FORMAT(CONVERT_TZ(s.started_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%H:%i:%s.000Z') as started_at,
        DATE_FORMAT(CONVERT_TZ(s.last_activity, @@session.time_zone, '+00:00'), '%Y-%m-%dT%H:%i:%s.000Z') as last_activity,
        u.email, u.role
     FROM active_sessions s 
     JOIN users u ON s.user_id = u.userid 
     WHERE s.is_active = TRUE 
     AND s.last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
     ORDER BY s.last_activity DESC`,
      [],
      (err, result) => {
        if (err) {
          console.error("Error fetching active sessions:", err);
          return res.status(500).json({ error: "Failed to fetch sessions" });
        }
        res.json(result);
      }
    );
  }
);

// Teacher Dashboard: Get all proctoring events
app.get(
  "/api/teacher/proctoring-events",
  authenticateUser,
  isTeacher,
  (req, res) => {
    const { limit = 100, severity, user_id, q_id } = req.query;

    let query = `
    SELECT 
      e.event_id, e.user_id, e.q_id, e.event_type, e.event_details, e.severity,
      DATE_FORMAT(CONVERT_TZ(e.timestamp, @@session.time_zone, '+00:00'), '%Y-%m-%dT%H:%i:%s.000Z') as timestamp,
      u.username, u.email, q.qname 
    FROM proctoring_events e 
    JOIN users u ON e.user_id = u.userid 
    LEFT JOIN questions q ON e.q_id = q.q_id 
    WHERE 1=1
  `;
    const params = [];

    if (severity) {
      query += " AND e.severity = ?";
      params.push(severity);
    }

    if (user_id) {
      query += " AND e.user_id = ?";
      params.push(user_id);
    }

    if (q_id) {
      query += " AND e.q_id = ?";
      params.push(q_id);
    }

    query += " ORDER BY e.timestamp DESC LIMIT ?";
    params.push(parseInt(limit));

    db.query(query, params, (err, result) => {
      if (err) {
        console.error("Error fetching proctoring events:", err);
        return res.status(500).json({ error: "Failed to fetch events" });
      }
      res.json(result);
    });
  }
);

// Teacher Dashboard: Get all users with their activity stats
app.get(
  "/api/teacher/users-overview",
  authenticateUser,
  isTeacher,
  (req, res) => {
    const query = `
    SELECT 
      u.userid,
      u.username,
      u.email,
      COALESCE(u.role, 'student') as role,
      COUNT(DISTINCT s.q_id) as problems_solved,
      (SELECT COUNT(*) FROM active_sessions WHERE user_id = u.userid AND is_active = TRUE AND last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)) as active_now,
      (SELECT COALESCE(SUM(tab_switches), 0) FROM active_sessions WHERE user_id = u.userid) as total_tab_switches,
      (SELECT COALESCE(SUM(copy_paste_count), 0) FROM active_sessions WHERE user_id = u.userid) as total_copy_pastes,
      (SELECT COUNT(*) FROM proctoring_events WHERE user_id = u.userid AND severity = 'high') as high_severity_events
    FROM users u
    LEFT JOIN solved s ON u.userid = s.user_id
    WHERE (u.role IS NULL OR (u.role != 'teacher' AND u.role != 'admin'))
    GROUP BY u.userid
    ORDER BY high_severity_events DESC, total_tab_switches DESC
  `;

    db.query(query, [], (err, result) => {
      if (err) {
        console.error("Error fetching users overview:", err);
        return res.status(500).json({ error: "Failed to fetch users" });
      }
      res.json(result);
    });
  }
);

// Teacher Dashboard: Get summary statistics
app.get(
  "/api/teacher/dashboard-stats",
  authenticateUser,
  isTeacher,
  (req, res) => {
    const query = `
    SELECT 
      (SELECT COUNT(*) FROM users WHERE (role IS NULL OR (role != 'teacher' AND role != 'admin'))) as total_students,
      (SELECT COUNT(DISTINCT user_id) FROM active_sessions WHERE is_active = TRUE AND last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)) as active_students,
      (SELECT COUNT(*) FROM active_sessions WHERE is_active = TRUE AND last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)) as active_sessions,
      (SELECT COUNT(*) FROM proctoring_events WHERE severity = 'high' AND DATE(timestamp) = CURDATE()) as high_severity_today,
      (SELECT COUNT(*) FROM proctoring_events WHERE DATE(timestamp) = CURDATE()) as total_events_today
  `;

    db.query(query, [], (err, result) => {
      if (err) {
        console.error("Error fetching dashboard stats:", err);
        return res.status(500).json({ error: "Failed to fetch stats" });
      }
      res.json(result[0]);
    });
  }
);

// Teacher Dashboard: Check for code similarity
app.post(
  "/api/teacher/check-similarity",
  authenticateUser,
  isTeacher,
  async (req, res) => {
    try {
      const { q_id } = req.body;

      // Get all submissions for this question
      db.query(
        "SELECT cs.*, u.username FROM code_submissions cs JOIN users u ON cs.user_id = u.userid WHERE cs.q_id = ? ORDER BY cs.submitted_at DESC",
        [q_id],
        (err, submissions) => {
          if (err) {
            console.error("Error fetching submissions:", err);
            return res
              .status(500)
              .json({ error: "Failed to fetch submissions" });
          }

          // Simple similarity check (comparing normalized code)
          const similarityResults = [];

          for (let i = 0; i < submissions.length; i++) {
            for (let j = i + 1; j < submissions.length; j++) {
              const similarity = calculateSimilarity(
                submissions[i].code,
                submissions[j].code
              );

              if (similarity > 0.85) {
                similarityResults.push({
                  user1: submissions[i].username,
                  user1_id: submissions[i].user_id,
                  user2: submissions[j].username,
                  user2_id: submissions[j].user_id,
                  similarity: similarity,
                  submission1_id: submissions[i].submission_id,
                  submission2_id: submissions[j].submission_id,
                });
              }
            }
          }

          res.json({
            total_submissions: submissions.length,
            suspicious_pairs: similarityResults,
          });
        }
      );
    } catch (error) {
      console.error("Error in check-similarity:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Simple string similarity calculation (Levenshtein-based)
function calculateSimilarity(str1, str2) {
  // Normalize strings: remove whitespace and comments
  const normalize = (str) => {
    return str
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "") // Remove comments
      .replace(/\s+/g, "") // Remove whitespace
      .toLowerCase();
  };

  const normalized1 = normalize(str1);
  const normalized2 = normalize(str2);

  if (normalized1 === normalized2) return 1.0;

  const longer =
    normalized1.length > normalized2.length ? normalized1 : normalized2;
  const shorter =
    normalized1.length > normalized2.length ? normalized2 : normalized1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Teacher Dashboard: Get all code submissions
app.get(
  "/api/teacher/code-submissions",
  authenticateUser,
  isTeacher,
  (req, res) => {
    const { limit = 100, user_id, q_id } = req.query;

    let query = `
    SELECT 
      cs.submission_id, cs.user_id, cs.q_id, cs.code, cs.language,
      DATE_FORMAT(CONVERT_TZ(cs.submitted_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%H:%i:%s.000Z') as submitted_at,
      u.username, u.email,
      q.qname, q.qtype
    FROM code_submissions cs
    JOIN users u ON cs.user_id = u.userid
    JOIN questions q ON cs.q_id = q.q_id
    WHERE 1=1
  `;
    const params = [];

    if (user_id) {
      query += " AND cs.user_id = ?";
      params.push(user_id);
    }

    if (q_id) {
      query += " AND cs.q_id = ?";
      params.push(q_id);
    }

    query += " ORDER BY cs.submitted_at DESC LIMIT ?";
    params.push(parseInt(limit));

    db.query(query, params, (err, result) => {
      if (err) {
        console.error("Error fetching code submissions:", err);
        return res.status(500).json({ error: "Failed to fetch submissions" });
      }
      res.json(result);
    });
  }
);

// Teacher Dashboard: Get user details
app.get(
  "/api/teacher/user/:userid",
  authenticateUser,
  isTeacher,
  (req, res) => {
    const userid = req.params.userid;

    const queries = {
      user: "SELECT userid, username, email, role FROM users WHERE userid = ?",
      sessions: `
        SELECT 
          session_id, user_id, username, q_id, problem_name, language,
          tab_switches, copy_paste_count, is_active,
          DATE_FORMAT(CONVERT_TZ(started_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%H:%i:%s.000Z') as started_at,
          DATE_FORMAT(CONVERT_TZ(last_activity, @@session.time_zone, '+00:00'), '%Y-%m-%dT%H:%i:%s.000Z') as last_activity
        FROM active_sessions 
        WHERE user_id = ? 
        ORDER BY started_at DESC 
        LIMIT 20
      `,
      events: `
        SELECT 
          e.event_id, e.user_id, e.q_id, e.event_type, e.event_details, e.severity,
          DATE_FORMAT(CONVERT_TZ(e.timestamp, @@session.time_zone, '+00:00'), '%Y-%m-%dT%H:%i:%s.000Z') as timestamp,
          q.qname 
        FROM proctoring_events e 
        LEFT JOIN questions q ON e.q_id = q.q_id 
        WHERE e.user_id = ? 
        ORDER BY e.timestamp DESC 
        LIMIT 50
      `,
      solved: `
        SELECT q.q_id, q.qname, q.qtype, s.user_id 
        FROM solved s 
        JOIN questions q ON s.q_id = q.q_id 
        WHERE s.user_id = ?
      `,
    };

    const results = {};

    db.query(queries.user, [userid], (err, user) => {
      if (err) return res.status(500).json({ error: "Database error" });
      results.user = user[0];

      db.query(queries.sessions, [userid], (err, sessions) => {
        if (err) return res.status(500).json({ error: "Database error" });
        results.sessions = sessions;

        db.query(queries.events, [userid], (err, events) => {
          if (err) return res.status(500).json({ error: "Database error" });
          results.events = events;

          db.query(queries.solved, [userid], (err, solved) => {
            if (err) return res.status(500).json({ error: "Database error" });
            results.solved = solved;

            res.json(results);
          });
        });
      });
    });
  }
);

// DELETE endpoint to clear proctoring events for a specific student
app.delete(
  "/api/teacher/clear-proctoring-events/:userid",
  authenticateUser,
  isTeacher,
  (req, res) => {
    const userid = req.params.userid;

    const query = "DELETE FROM proctoring_events WHERE user_id = ?";

    db.query(query, [userid], (err, result) => {
      if (err) {
        console.error("Error clearing proctoring events:", err);
        return res.status(500).json({
          error: "Database error",
          success: false,
        });
      }

      res.json({
        success: true,
        message: `Cleared ${result.affectedRows} proctoring event(s) for user ${userid}`,
        deletedCount: result.affectedRows,
      });
    });
  }
);

// DELETE endpoint to clear all proctoring events for all students
app.delete(
  "/api/teacher/clear-all-proctoring-events",
  authenticateUser,
  isTeacher,
  (req, res) => {
    const query = "DELETE FROM proctoring_events";

    db.query(query, [], (err, result) => {
      if (err) {
        console.error("Error clearing all proctoring events:", err);
        return res.status(500).json({
          error: "Database error",
          success: false,
        });
      }

      res.json({
        success: true,
        message: `Cleared all ${result.affectedRows} proctoring event(s)`,
        deletedCount: result.affectedRows,
      });
    });
  }
);

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

// Automatic cleanup of stale sessions (runs every 2 minutes)
function cleanupStaleSessions() {
  db.query(
    `UPDATE active_sessions 
     SET is_active = FALSE 
     WHERE is_active = TRUE 
     AND last_activity < DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
    [],
    (err, result) => {
      if (err) {
        console.error("Error cleaning up stale sessions:", err);
      }
    }
  );
}

// Run cleanup every 2 minutes
setInterval(cleanupStaleSessions, 2 * 60 * 1000);

// Run cleanup on startup
cleanupStaleSessions();

// ============================================================
// SECURITY SYSTEM INITIALIZATION
// ============================================================

// Global function for flushing batched proctoring events
global.flushProctoringBatch = (batch) => {
  if (!batch || batch.length === 0) return;

  console.log(`📊 Flushing ${batch.length} proctoring events to database`);

  // Prepare bulk insert query
  const values = batch.map((event) => [
    event.userId,
    event.qId || null,
    event.eventType,
    event.eventDetails || "",
    event.severity || "low",
    event.timestamp,
  ]);

  const query = `
    INSERT INTO proctoring_events (user_id, q_id, event_type, event_details, severity, timestamp) 
    VALUES ?
  `;

  db.query(query, [values], (err, result) => {
    if (err) {
      console.error("❌ Error flushing proctoring batch:", err);
    } else {
      console.log(`✅ Flushed ${result.affectedRows} proctoring events`);
    }
  });
};

// Start security systems
console.log("🔒 Initializing security systems...");
startBatchFlushing();
startPeriodicCleanup();
console.log("✅ Security systems initialized");

// API endpoint to get security stats (for monitoring)
app.get("/api/security/stats", authenticateUser, isTeacher, (req, res) => {
  res.json(getSecurityStats());
});

httpServer.listen(port, () => {
  console.log("http server up at ", port);
  console.log("🔒 Security middleware active");
});
