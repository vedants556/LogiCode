import React, { useEffect, useRef, useState } from "react";
import "./Output.css";

function Output(props) {
  const outputRef = useRef(" ");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const baseURL = "https://emkc.org/api/v2/piston/execute"; //post
  const [TR, setTR] = useState("T"); //toggle testcase or result
  const [wInput, setWrongIp] = useState();
  const [expectedIP, setEOP] = useState();
  const [yInput, setYIP] = useState();
  const [resultBoxColor, setRBC] = useState("white");
  const [aicheckRemark, setAIcheckRemark] = useState("");
  const [output2, setOP2] = useState("Your output here");
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [showAI, setShowAI] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  const a = [1, 2, 11, 55];
  const red = "#f7564a";

  async function check() {
    //function to check if the code is correct or not
    setIsRunning(true);
    setEOP("processing...");
    setWrongIp("processing...");
    setYIP("processing...");
    setRBC("yellow");
    setTR("R");

    setError("");
    const checkData = {};
    checkData.usercode = props.code;
    checkData.qid = props.qid;
    checkData.language = props.language || "c";

    try {
      const response = await fetch("/api/checktc", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkData),
      });

      const data = await response.json();
      console.log(data.remark);

      data.remark === "correct" ? setRBC("#4caf50") : setRBC("#f44336");

      if (data.error) {
        setError(data.error);
      }

      setStatus((s) => data.remark);

      setEOP(data.expected_output);
      setWrongIp(data.input);
      setYIP(data.your_output);

      if (data.remark == "correct") {
        props.setSolved(true);

        setEOP("All test cases passed!");
        setWrongIp("All test cases passed!");
        setYIP("All test cases passed!");

        const resp = await fetch("/api/solved", {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userid: props.userid,
            qid: props.qid,
          }),
        });

        const solvedStatus = await resp.json();
        console.log(solvedStatus);
      }
    } catch (error) {
      console.error("Error checking code:", error);
      setError("An error occurred while checking your code");
      setRBC("#f44336");
    } finally {
      setIsRunning(false);
    }
  }

  async function checkByAI() {
    //function to check problem with AI
    setIsRunning(true);
    setAIcheckRemark("AI is checking your code...");
    setRBC("#ff9800");
    setTR("R");

    console.log(props.desc1);

    const dataToCheckByAI = {
      code: props.code,
      //userid, code, qid
      desc: props.desc1,
      userid: props.userid,
      qid: props.qid,
      language: props.language || "c",
    };

    try {
      const resp = await fetch("/api/checkbyai", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToCheckByAI),
      });

      const aiResult = await resp.json();

      console.log(aiResult);

      console.log(aiResult.response);
      setAIcheckRemark(aiResult.response);

      if (aiResult.response.includes("pass")) {
        props.setSolved(true);
        setRBC("#4caf50");
        console.log("RBC IS " + resultBoxColor);
      } else {
        setRBC("#f44336");
        console.log(resultBoxColor);
      }
    } catch (error) {
      console.error("Error with AI check:", error);
      setAIcheckRemark("An error occurred while checking your code with AI");
      setRBC("#f44336");
    } finally {
      setIsRunning(false);
    }
  }

  async function getAIHelp() {
    setIsRunning(true);
    setShowAI(true);
    setAiResponse("AI is analyzing your code...");

    try {
      const response = await fetch("/api/aihelp", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: props.code,
          description: props.desc1,
          language: props.language || "c",
        }),
      });

      const data = await response.json();
      setAiResponse(data.response);
    } catch (error) {
      console.error("Error getting AI help:", error);
      setAiResponse("An error occurred while getting AI assistance");
    } finally {
      setIsRunning(false);
    }
  }

  async function exec() {
    setIsRunning(true);
    setTR("T");
    try {
      // Get language configuration from backend
      const langResponse = await fetch("/api/languages");
      const languages = await langResponse.json();
      const selectedLang = props.language || "c";
      const langConfig = languages[selectedLang] || languages.c;

      console.log(typeof props.code);
      const finalCode = props.code;
      console.log(finalCode);

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
              name: `my_cool_code.${langConfig.fileExtension}`,
              content: finalCode,
            },
          ],
          stdin: "",
          args: [],
          compile_timeout: 10000,
          run_timeout: 3000,
        }),
      });

      const data = await response.json();
      let o = data.run.stderr || data.run.stdout;
      setOP2(o);

      // Show the output in the testcases tab
      setTR("T");

      console.log("Execution result:", data);
    } catch (error) {
      alert("an error occurred, please try again later");
      console.log(error);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="leetcode-output-container">
      {/* Header with buttons */}
      <div className="output-header">
        <div className="output-tabs">
          <button
            className={`tab-button ${TR === "T" ? "active" : ""}`}
            onClick={() => setTR("T")}
          >
            Testcases
          </button>
          <button
            className={`tab-button ${TR === "R" ? "active" : ""}`}
            onClick={() => setTR("R")}
          >
            Result
          </button>
        </div>

        <div className="action-buttons">
          <button
            className="action-btn run-btn"
            onClick={exec}
            disabled={isRunning}
          >
            {isRunning ? "Running..." : "Run"}
          </button>

          <button
            className="action-btn submit-btn"
            onClick={props.checkBy === "testcase" ? check : checkByAI}
            disabled={isRunning}
          >
            {isRunning ? "Checking..." : "Submit"}
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="output-content">
        {TR === "T" ? (
          <div className="testcases-section">
            <div className="testcases-header">
              <h3>Test Cases</h3>
              <span className="testcase-count">
                {props.testcases?.length || 0} test cases
              </span>
            </div>

            {/* Show run output if available */}
            {output2 && output2 !== "Your output here" && (
              <div className="run-output">
                <h4>Run Output:</h4>
                <div className="output-content">
                  <pre>{output2}</pre>
                </div>
              </div>
            )}

            <div className="testcases-list">
              {props.testcases?.map((tc, index) => (
                <div key={tc.t_id || index} className="testcase-item">
                  <div className="testcase-number">Case {index + 1}</div>
                  <div className="testcase-input">
                    <strong>Input:</strong> {tc.ip}
                  </div>
                  <div className="testcase-expected">
                    <strong>Expected:</strong> {tc.op}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="result-section">
            {showAI ? (
              <div className="ai-assistant">
                <div className="ai-header">
                  <span className="ai-icon">🤖</span>
                  <h3>AI Assistant</h3>
                  <button
                    className="close-ai-btn"
                    onClick={() => setShowAI(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="ai-response">{aiResponse}</div>
              </div>
            ) : (
              <div
                className="result-window"
                style={{
                  borderColor: resultBoxColor,
                  backgroundColor:
                    resultBoxColor === "#4caf50"
                      ? "rgba(76, 175, 80, 0.1)"
                      : resultBoxColor === "#f44336"
                      ? "rgba(244, 67, 54, 0.1)"
                      : "rgba(255, 255, 255, 0.05)",
                }}
              >
                <div className="result-header">
                  <h3>Result</h3>
                  <div
                    className={`status-indicator ${
                      status === "correct" ? "success" : "error"
                    }`}
                  >
                    {status === "correct"
                      ? "✓ Passed"
                      : status === "wrong"
                      ? "✗ Failed"
                      : "⏳ Processing"}
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {wInput && (
                  <div className="result-details">
                    <div className="result-item">
                      <strong>Input:</strong> {wInput}
                    </div>
                    <div className="result-item">
                      <strong>Your Output:</strong> {yInput}
                    </div>
                    <div className="result-item">
                      <strong>Expected Output:</strong> {expectedIP}
                    </div>
                  </div>
                )}

                {aicheckRemark && (
                  <div className="ai-result">
                    <strong>AI Analysis:</strong> {aicheckRemark}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Output;
