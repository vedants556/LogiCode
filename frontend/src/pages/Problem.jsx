import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import Output from "../components/Output";
import Description from "../components/Description";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import { Link } from "react-router-dom";
import "./Problem.css";

function Problem() {
  // Timer state
  const [timer, setTimer] = useState(null); // in seconds
  const [timeLeft, setTimeLeft] = useState(null); // in seconds
  const timerInterval = useRef(null);
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

  // Initial load: fetch problem, languages, testcases, solved
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
      // Timer logic: if timer is set, start countdown
      if (data[0].timer && data[0].timer > 0) {
        const seconds = parseInt(data[0].timer) * 60;
        setTimer(seconds);
        setTimeLeft(seconds);
      }
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

  // Timer countdown effect
  useEffect(() => {
    if (timer && timeLeft !== null && timeLeft > 0) {
      timerInterval.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 1) {
            clearInterval(timerInterval.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval.current);
  }, [timer, timeLeft]);

  // Auto-submit function
  async function handleAutoSubmit() {
    alert("Time is up! Your code will be submitted automatically.");
    // TODO: Trigger Output's submit logic here if possible
  }

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    if (languages[newLanguage]) {
      setValue(languages[newLanguage].defaultCode);
    }
  };

  // console.log(value);
  return (
    <div className="problem-container">
      <div className="problem-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <Navbar />

      <div className="problem-content">
        {timer && timeLeft !== null && (
          <div className="timer-display">
            <div className="timer-icon">⏰</div>
            <div className="timer-text">
              Time Left: {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </div>
          </div>
        )}

        <div className="problem-layout">
          <div className="problem-sidebar">
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

          <div className="problem-main">
            <div className="editor-section">
              <div className="editor-header">
                <h3 className="editor-title">Code Editor</h3>
                <div className="language-selector">
                  <label htmlFor="language-select" className="language-label">
                    Language:
                  </label>
                  <select
                    id="language-select"
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="language-select"
                  >
                    {Object.keys(languages).map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="editor-container">
                <Editor
                  height="60vh"
                  width="100%"
                  language={languages[selectedLanguage]?.language || "c"}
                  value={value}
                  onChange={(value, e) => setValue((e1) => value)}
                  className="code-editor"
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: "on",
                    lineNumbers: "on",
                    folding: true,
                    bracketPairColorization: { enabled: true },
                    renderWhitespace: "selection",
                  }}
                />
              </div>
            </div>

            <div className="output-section">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Problem;
