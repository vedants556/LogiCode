import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
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
  const [availableLanguages, setAvailableLanguages] = useState({});
  const [value, setValue] = useState("");
  const editorRef = useRef("");
  const [solved, setSolved] = useState(false);
  const [testcases, setTestcases] = useState([]);
  const [problemData, setProbData] = useState([]);
  const [checkBy, setCheckBy] = useState("");
  const [userid, setUserId] = useState(0);
  const [desc1, setDesc1] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [leftPanelTab, setLeftPanelTab] = useState("description");
  const [aiResponse, setAiResponse] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [logged, islogged] = useState(true);
  const [socket, setSocket] = useState(null);
  const [live, setLive] = useState(false);
  const [people, setPeople] = useState([]);
  const [username, setUname] = useState("");
  const navigate = useNavigate();

  // Proctoring states
  const [tabSwitches, setTabSwitches] = useState(0);
  const [copyPasteCount, setCopyPasteCount] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [proctoringEnabled, setProctoringEnabled] = useState(true);
  const [showProctoringNotice, setShowProctoringNotice] = useState(false);
  const [violationWarning, setViolationWarning] = useState("");
  const [showViolationWarning, setShowViolationWarning] = useState(false);

  // const [q_id, setQid] = useState(-1)

  // Proctoring: Track tab visibility changes
  useEffect(() => {
    if (!proctoringEnabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden && qid && problemData.length > 0) {
        // Tab switched away
        setTabSwitches((prev) => prev + 1);
        logProctoringEvent(
          "tab_switch",
          "User switched away from the problem page",
          "medium"
        );
        updateSessionCounter("tab_switch");
      }
    };

    const handleBlur = () => {
      if (qid && problemData.length > 0) {
        logProctoringEvent(
          "window_blur",
          "User switched to another window",
          "low"
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [qid, problemData, proctoringEnabled]);

  // Proctoring: Disable right-click and dev tools
  useEffect(() => {
    if (!proctoringEnabled) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      logProctoringEvent(
        "right_click_attempt",
        "User attempted to right-click",
        "low"
      );
      return false;
    };

    const handleKeyDown = (e) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
        logProctoringEvent(
          "devtools_attempt",
          `User attempted to open dev tools: ${e.key}`,
          "high"
        );
        return false;
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [proctoringEnabled]);

  // Proctoring: Track and PREVENT copy/paste
  useEffect(() => {
    if (!proctoringEnabled) return;

    const handlePaste = (e) => {
      // Allow paste in editor only
      const target = e.target;
      const isEditor =
        target.closest(".monaco-editor") ||
        target.classList.contains("inputarea") ||
        target.getAttribute("data-mode-id");

      if (!isEditor) {
        e.preventDefault();
        showWarning("⚠️ Paste is not allowed outside the code editor!");
        return;
      }

      setCopyPasteCount((prev) => prev + 1);
      const pastedText = e.clipboardData?.getData("text") || "";
      logProctoringEvent(
        "paste",
        `User pasted ${pastedText.length} characters in editor`,
        pastedText.length > 100 ? "high" : "medium"
      );
      updateSessionCounter("paste");
    };

    const handleCopy = (e) => {
      const selectedText = window.getSelection()?.toString() || "";
      const target = e.target;

      // Prevent copying from problem description
      const isProblemDescription =
        target.closest(".problem-description-panel") ||
        target.closest(".description-content") ||
        target.closest(".problem-statement");

      if (isProblemDescription && selectedText.length > 0) {
        e.preventDefault();
        showWarning("⚠️ Copying from problem description is not allowed!");
        logProctoringEvent(
          "copy_attempt_blocked",
          `User attempted to copy ${selectedText.length} characters from description`,
          "medium"
        );
        return;
      }

      if (selectedText.length > 50) {
        logProctoringEvent(
          "copy",
          `User copied ${selectedText.length} characters`,
          "low"
        );
      }
    };

    // Prevent select on problem description
    const handleSelectStart = (e) => {
      const target = e.target;
      const isProblemDescription =
        target.closest(".problem-description-panel") ||
        target.closest(".description-content") ||
        target.closest(".problem-statement");

      if (isProblemDescription) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("paste", handlePaste);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("selectstart", handleSelectStart);

    return () => {
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, [proctoringEnabled]);

  // Proctoring: Start session when problem loads
  useEffect(() => {
    if (problemData.length > 0 && qid && proctoringEnabled) {
      startProctoringSession();
      // Show proctoring notice
      setShowProctoringNotice(true);
      setTimeout(() => {
        setShowProctoringNotice(false);
      }, 8000);
    }

    // End session when leaving
    return () => {
      if (qid && proctoringEnabled) {
        endProctoringSession();
      }
    };
  }, [problemData, qid, proctoringEnabled]);

  // Proctoring helper functions
  const logProctoringEvent = async (
    event_type,
    event_details,
    severity = "low"
  ) => {
    try {
      await fetch("/api/proctoring/log-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer " + localStorage.getItem("auth"),
        },
        body: JSON.stringify({
          q_id: qid,
          event_type,
          event_details,
          severity,
        }),
      });
    } catch (error) {
      console.error("Error logging proctoring event:", error);
    }
  };

  const startProctoringSession = async () => {
    try {
      const response = await fetch("/api/proctoring/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer " + localStorage.getItem("auth"),
        },
        body: JSON.stringify({
          q_id: qid,
          problem_name: problemData[0]?.qname || "",
          language: selectedLanguage,
        }),
      });
      const data = await response.json();
      setSessionId(data.session_id);
    } catch (error) {
      console.error("Error starting proctoring session:", error);
    }
  };

  const endProctoringSession = async () => {
    try {
      await fetch("/api/proctoring/end-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer " + localStorage.getItem("auth"),
        },
        body: JSON.stringify({
          q_id: qid,
        }),
      });
    } catch (error) {
      console.error("Error ending proctoring session:", error);
    }
  };

  const updateSessionCounter = async (counter_type) => {
    try {
      await fetch("/api/proctoring/update-counter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer " + localStorage.getItem("auth"),
        },
        body: JSON.stringify({
          q_id: qid,
          counter_type,
        }),
      });
    } catch (error) {
      console.error("Error updating session counter:", error);
    }
  };

  const showWarning = (message) => {
    setViolationWarning(message);
    setShowViolationWarning(true);
    setTimeout(() => {
      setShowViolationWarning(false);
    }, 4000);
  };

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

      // Filter available languages based on problem's selected languages
      if (data[0].selected_languages && data[0].selected_languages.length > 0) {
        const filteredLanguages = {};
        data[0].selected_languages.forEach((lang) => {
          if (languages[lang]) {
            filteredLanguages[lang] = languages[lang];
          }
        });
        setAvailableLanguages(filteredLanguages);

        // Set default language to first available language
        if (data[0].selected_languages.length > 0) {
          setSelectedLanguage(data[0].selected_languages[0]);
        }
      } else {
        // Fallback to all languages if no specific languages are set
        setAvailableLanguages(languages);
      }

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
    getTestcases();
    checkSolved();
  }, []);

  // Load problem info after languages are loaded
  useEffect(() => {
    if (Object.keys(languages).length > 0) {
      async function getProblemInfo() {
        const response = await fetch("/api/getprobleminfo/" + qid);
        const data = await response.json();
        setProbData(data);
        setCheckBy(data[0].checkBy);

        // Filter available languages based on problem's selected languages
        if (
          data[0].selected_languages &&
          data[0].selected_languages.length > 0
        ) {
          const filteredLanguages = {};
          data[0].selected_languages.forEach((lang) => {
            if (languages[lang]) {
              filteredLanguages[lang] = languages[lang];
            }
          });
          setAvailableLanguages(filteredLanguages);

          // Set default language to first available language
          if (data[0].selected_languages.length > 0) {
            const firstLang = data[0].selected_languages[0];
            setSelectedLanguage(firstLang);

            // Set the language-specific template as the initial code
            if (
              data[0].language_templates &&
              data[0].language_templates[firstLang]
            ) {
              setValue(data[0].language_templates[firstLang]);
            } else {
              // Fallback to default code if no language template exists
              setValue(data[0].defcode);
            }
          }
        } else {
          // Fallback to all languages if no specific languages are set
          setAvailableLanguages(languages);
          setValue(data[0].defcode);
        }

        // Timer logic: if timer is set, start countdown
        if (data[0].timer && data[0].timer > 0) {
          const seconds = parseInt(data[0].timer) * 60;
          setTimer(seconds);
          setTimeLeft(seconds);
        }
      }
      getProblemInfo();
    }
  }, [languages, qid]);

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

  // Auto-submit function - simply triggers the submit button
  function handleAutoSubmit() {
    setNotificationMessage(
      "⏰ Time is up! Your code will be submitted automatically."
    );
    setShowNotification(true);

    // Auto-submit by triggering the submit button click
    setTimeout(() => {
      // Find and click the submit button
      const submitButton = document.querySelector(".submit-btn");
      if (submitButton && !submitButton.disabled) {
        console.log("🔄 Auto-submitting: Clicking submit button");
        submitButton.click();
      }
      setShowNotification(false);
    }, 2000);
  }

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);

    // Use language-specific template if available
    if (
      problemData.length > 0 &&
      problemData[0].language_templates &&
      problemData[0].language_templates[newLanguage]
    ) {
      setValue(problemData[0].language_templates[newLanguage]);
    } else if (availableLanguages[newLanguage]) {
      // Fallback to default language template
      setValue(availableLanguages[newLanguage].defaultCode);
    }
  };

  // AI Help function
  async function getAIHelp() {
    setShowAI(true);
    setAiResponse("AI is analyzing your code...");

    try {
      const response = await fetch("/api/aihelp", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: value,
          description: problemData[0]?.description || "",
          language: selectedLanguage || "c",
        }),
      });

      const data = await response.json();
      setAiResponse(data.response);
    } catch (error) {
      console.error("Error getting AI help:", error);
      setAiResponse("An error occurred while getting AI assistance");
    }
  }

  return (
    <div className="problem-container">
      <div className="problem-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <Navbar />

      {/* Proctoring Active Indicator */}
      {proctoringEnabled && (
        <div className="proctoring-indicator">
          <div className="proctoring-icon">🔒</div>
          <span className="proctoring-text">Proctoring Active</span>
          <div className="proctoring-pulse"></div>
        </div>
      )}

      {/* Proctoring Notice Modal */}
      {showProctoringNotice && (
        <div className="proctoring-notice-overlay">
          <div className="proctoring-notice">
            <div className="notice-header">
              <span className="notice-icon">🔒</span>
              <h3>Proctoring Mode Active</h3>
            </div>
            <div className="notice-content">
              <p>
                <strong>This session is being monitored.</strong>
              </p>
              <ul className="notice-rules">
                <li>❌ Do not switch tabs or windows</li>
                <li>❌ Do not copy from problem description</li>
                <li>❌ Developer tools are disabled</li>
                <li>❌ Right-click is disabled</li>
                <li>✅ You can paste code in the editor</li>
                <li>⚠️ All violations will be logged</li>
              </ul>
              <p className="notice-footer">Good luck! 🎯</p>
            </div>
            <button
              className="notice-close-btn"
              onClick={() => setShowProctoringNotice(false)}
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Violation Warning Toast */}
      {showViolationWarning && (
        <div className="violation-warning">
          <div className="violation-icon">⚠️</div>
          <span className="violation-message">{violationWarning}</span>
        </div>
      )}

      <div className="problem-content">
        {timer && timeLeft !== null && (
          <div
            className={`timer-display ${timeLeft <= 60 ? "timer-warning" : ""}`}
          >
            <div className="timer-icon">⏰</div>
            <div className="timer-text">
              {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </div>
            {timeLeft <= 60 && timeLeft > 0 && (
              <div className="timer-warning-text">
                ⚠️ Less than 1 minute remaining!
              </div>
            )}
          </div>
        )}

        {showNotification && (
          <div className="notification-overlay">
            <div className="notification">
              <div className="notification-content">
                <span className="notification-icon">⏰</span>
                <span className="notification-message">
                  {notificationMessage}
                </span>
                <button
                  className="notification-close"
                  onClick={() => setShowNotification(false)}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="leetcode-layout">
          {/* Left Panel - Problem Description */}
          <div className="problem-description-panel">
            <div className="description-header">
              <div className="problem-title-section">
                <h2 className="problem-title">
                  {problemData[0]?.qname || "Loading..."}
                </h2>
                <div className="problem-meta">
                  <span
                    className={`difficulty-badge ${
                      problemData[0]?.difficulty?.toLowerCase() || "medium"
                    }`}
                  >
                    {problemData[0]?.difficulty || "Medium"}
                  </span>
                  <span className="problem-type">
                    {problemData[0]?.qtype || "Algorithm"}
                  </span>
                </div>
              </div>
            </div>

            {/* Left Panel Tabs */}
            <div className="left-panel-tabs">
              <button
                className={`left-tab-button ${
                  leftPanelTab === "description" ? "active" : ""
                }`}
                onClick={() => setLeftPanelTab("description")}
              >
                Description
              </button>
              <button
                className={`left-tab-button ${
                  leftPanelTab === "ai" ? "active" : ""
                }`}
                onClick={() => setLeftPanelTab("ai")}
              >
                🤖 AI Help
              </button>
            </div>

            <div className="left-panel-content">
              {leftPanelTab === "description" ? (
                <div className="description-content">
                  <div className="problem-statement">
                    <div className="statement-text">
                      <ReactMarkdown>
                        {problemData[0]?.description ||
                          "Loading problem description..."}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ai-help-content">
                  <div className="ai-help-header">
                    <h3>AI Assistant</h3>
                    <button className="get-ai-help-btn" onClick={getAIHelp}>
                      Get AI Help
                    </button>
                  </div>

                  {showAI && (
                    <div className="ai-response-container">
                      <div className="ai-response">{aiResponse}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Code Editor & Output */}
          <div className="coding-panel">
            <div className="editor-section">
              <div className="editor-header">
                <div className="editor-title-section">
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
                      {Object.keys(availableLanguages).map((lang) => (
                        <option key={lang} value={lang}>
                          {lang.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="editor-container">
                <Editor
                  height="50vh"
                  width="100%"
                  language={
                    availableLanguages[selectedLanguage]?.language || "c"
                  }
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
