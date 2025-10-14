import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import Output from "../components/Output";
import Description from "../components/Description";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import { Link } from "react-router-dom";

function Problem() {
  //description, usecase

  //get info, testcases using useEffect
  //create solved/unsolved useState variable
  //function checkTestCases, useState solved to be passed to Output component
  //if test cases are true, send req to backend and update
  // => solved

  const qid = useParams().qid;

  console.log(qid);

  const [selectedLanguage, setSelectedLanguage] = useState("c");
  const [languages, setLanguages] = useState({});
  const [value, setValue] = useState("");
  const editorRef = useRef("");
  const [solved, setSolved] = useState(false);
  const [testcases, setTestcases] = useState([]);
  const [problemData, setProbData] = useState([]);
  const [checkBy, setCheckBy] = useState("");
  const [userid, setUserId] = useState(0);
  const [desc1, setDesc1] = useState("");
  const [logged, islogged] = useState(true);
  const [socket, setSocket] = useState(null);
  const [live, setLive] = useState(false);
  const [people, setPeople] = useState([]);
  const [username, setUname] = useState("");
  const navigate = useNavigate();

  // const [q_id, setQid] = useState(-1)

  useEffect(() => {
    function checkLogged() {
      if (localStorage.getItem("auth")) {
        console.log("logged in");
      } else {
        navigate("../../logsign");
      }
    }

    async function getLanguages() {
      const response = await fetch("/api/languages");
      const data = await response.json();
      setLanguages(data);
    }

    async function getProblemInfo() {
      const response = await fetch("/api/getprobleminfo/" + qid);
      const data = await response.json();
      setProbData(data);
      setValue(data[0].defcode);
      setCheckBy(data[0].checkBy);
    }

    async function getTestcases() {
      const response = await fetch("/api/getTestcases/" + qid);
      const data = await response.json();
      console.log(data);
      setTestcases(data);
    }

    async function checkSolved() {
      //to do
      const resp = await fetch("/api/checksolved", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer " + localStorage.getItem("auth"),
        },
        body: JSON.stringify({
          authToken: localStorage.getItem("auth"),
          // 'userid' : userid,
          qid: qid,
        }),
      });

      const data = await resp.json();

      setSolved(data.status);
      setUserId(data.userid);
      console.log(data);
    }

    checkLogged();
    getLanguages();
    getProblemInfo();
    getTestcases();
    checkSolved();
  }, []);

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    if (languages[newLanguage]) {
      setValue(languages[newLanguage].defaultCode);
    }
  };

  // console.log(value);
  return (
    <>
      <div className="problemContainer">
        <div className="editorBox">
          <div className="language-selector">
            <label htmlFor="language-select">Language: </label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              style={{
                padding: "8px",
                margin: "10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#2d3748",
                color: "white",
              }}
            >
              {Object.keys(languages).map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <Editor
            height="70vh"
            width={"inherit"}
            language={languages[selectedLanguage]?.language || "c"}
            value={value}
            onChange={(value, e) => setValue((e1) => value)}
            className="editor"
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        <Output
          desc1={desc1}
          userid={userid}
          setSolved={setSolved}
          testcases={testcases}
          qid={qid}
          checkBy={checkBy}
          code={value}
          language={selectedLanguage}
        />

        <Description
          setDesc1={setDesc1}
          solved={solved}
          value={value}
          problemData={problemData}
          setValue={setValue}
          socket={socket}
          setSocket={setSocket}
          live={live}
          setLive={setLive}
          username={username}
          setUname={setUname}
        />
      </div>
    </>
  );
}

export default Problem;
