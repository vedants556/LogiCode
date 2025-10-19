import React, { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import Navbar from "../components/Navbar/Navbar";
import "./AddQuestion.css";

function AddQuestion() {
  const timerRef = useRef(); // timer in minutes
  const [tc, showTC] = useState(false); //if the user wants check by testcase or not
  const [tcIndex, setTCIndex] = useState(0); //current testcase index
  const [testCases, setTestcases] = useState([]); //array to store testcases
  const [defaultCode, setDefCode] = useState(""); //default code of question
  const [funcName, setFuncName] = useState(); //function name
  const [answerCode, setAnsCode] = useState(""); //solution
  const [selectedLanguage, setSelectedLanguage] = useState("c"); //selected language
  const [selectedLanguages, setSelectedLanguages] = useState(["c"]); //multiple selected languages
  const [languages, setLanguages] = useState({}); //available languages
  const [languageTemplates, setLanguageTemplates] = useState({}); //templates for each language
  const [languageSolutions, setLanguageSolutions] = useState({}); //solutions for each language

  //form inputs
  const qname = useRef(0);
  const desc = useRef(0);
  const qtype = useRef(0);

  // Load languages on component mount
  React.useEffect(() => {
    async function getLanguages() {
      const response = await fetch("/api/languages");
      const data = await response.json();
      setLanguages(data);

      // Initialize templates and solutions for all languages
      const templates = {};
      const solutions = {};
      Object.keys(data).forEach((lang) => {
        templates[lang] = data[lang].defaultCode;
        solutions[lang] = data[lang].defaultCode;
      });
      setLanguageTemplates(templates);
      setLanguageSolutions(solutions);

      // Set default for first selected language
      if (data[selectedLanguages[0]]) {
        setDefCode(data[selectedLanguages[0]].defaultCode);
        setAnsCode(data[selectedLanguages[0]].defaultCode);
      }
    }
    getLanguages();
    // eslint-disable-next-line
  }, []);

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    if (languages[newLanguage]) {
      setDefCode(languages[newLanguage].defaultCode);
      setAnsCode(languages[newLanguage].defaultCode);
    }
  };

  // Handle multiple language selection
  const handleLanguageToggle = (language) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(language)) {
        // Remove language
        const newLangs = prev.filter((lang) => lang !== language);
        if (newLangs.length === 0) {
          // If no languages selected, keep at least one
          return prev;
        }
        return newLangs;
      } else {
        // Add language
        return [...prev, language];
      }
    });
  };

  // Update template for specific language
  const updateLanguageTemplate = (language, code) => {
    setLanguageTemplates((prev) => ({
      ...prev,
      [language]: code,
    }));
  };

  // Update solution for specific language
  const updateLanguageSolution = (language, code) => {
    setLanguageSolutions((prev) => ({
      ...prev,
      [language]: code,
    }));
  };

  // console.log(funcName);

  //function to delete testcase
  function deleteTestCase(index) {
    setTestcases((testc) =>
      testc.filter((tc) => {
        return tc.no != index;
      })
    );
    console.log(index + " deleted");
  }

  async function saveQuestion() {
    //function to save entire question

    const questionData = {};

    //name, description, checkBy, testcases (array)
    //create JSON and send it to backend

    if (!qtype.current.value || !qname.current.value) {
      return alert("Pls fill all details");
    }

    questionData.desc = desc.current.value;
    questionData.qname = qname.current.value;
    questionData.defaultCode = defaultCode;
    questionData.timer = timerRef.current
      ? parseInt(timerRef.current.value)
      : 0;

    tc ? (questionData.checkBy = "testcase") : (questionData.checkBy = "ai");

    questionData.testcases = testCases;
    questionData.funcName = funcName;
    questionData.solution = answerCode;
    questionData.qtype = qtype.current.value;

    // Add multi-language support
    questionData.selectedLanguages = selectedLanguages;
    questionData.languageTemplates = languageTemplates;
    questionData.languageSolutions = languageSolutions;

    console.log(questionData);

    //fetch API
    //go to another page

    const resp = await fetch("api/submitquestion", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(questionData),
    });

    const data = await resp.json();
    console.log(data);

    alert("question submitted suscessfully");
  }

  //returns the main form
  return (
    <div className="add-question-container">
      <div className="add-question-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <Navbar />

      <div className="add-question-content">
        <div className="add-question-header">
          <h1 className="page-title">Add New Question</h1>
          <p className="page-subtitle">
            Create a new coding problem for your platform
          </p>
        </div>

        <div className="add-question-form">
          {/* Basic Information Section */}
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="problem-name">Problem Name</label>
                <input
                  type="text"
                  id="problem-name"
                  className="form-input"
                  placeholder="Enter problem name"
                  ref={qname}
                />
              </div>

              <div className="form-group">
                <label htmlFor="problem-type">Problem Type</label>
                <select
                  name="problemDomain"
                  ref={qtype}
                  id="problem-type"
                  className="form-select"
                >
                  <option value="">Choose problem type</option>
                  <option value="algorithm">Algorithm</option>
                  <option value="array">Arrays</option>
                  <option value="string">Strings</option>
                  <option value="stack">Stack</option>
                  <option value="queue">Queue</option>
                  <option value="linkedlist">Linked List</option>
                  <option value="tree">Trees</option>
                  <option value="graph">Graph</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="timer-input">Time Limit (minutes)</label>
                <input
                  id="timer-input"
                  type="number"
                  min="0"
                  placeholder="Enter time in minutes (0 for no limit)"
                  ref={timerRef}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="language-select">Default Language</label>
                <select
                  id="language-select"
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="form-select"
                >
                  {Object.keys(languages).map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multi-Language Selection */}
            <div className="form-group">
              <label>Supported Languages</label>
              <div className="language-checkboxes">
                {Object.keys(languages).map((lang) => (
                  <label key={lang} className="language-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes(lang)}
                      onChange={() => handleLanguageToggle(lang)}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="language-label">{lang.toUpperCase()}</span>
                  </label>
                ))}
              </div>
              <p className="form-help">
                Select all languages you want to support for this problem
              </p>
            </div>
          </div>

          {/* Description Section */}
          <div className="form-section">
            <h3 className="section-title">Problem Description</h3>
            <div className="form-group">
              <label htmlFor="description">
                Description (Markdown Supported)
              </label>
              <textarea
                name=""
                id="description"
                className="form-textarea"
                placeholder="Add a description (markdown supported). Add testcases and examples too"
                rows={8}
                ref={desc}
              ></textarea>
            </div>
          </div>

          {/* Code Section - Dynamic for each selected language */}
          <div className="form-section">
            <h3 className="section-title">Code Templates & Solutions</h3>
            <p className="section-description">
              Define code templates and solutions for each selected language
            </p>

            {selectedLanguages.map((lang) => (
              <div key={lang} className="language-code-section">
                <div className="language-header">
                  <h4 className="language-title">{lang.toUpperCase()} Code</h4>
                  <span className="language-badge">{lang}</span>
                </div>

                <div className="code-editor-group">
                  <div className="code-editor-item">
                    <h5 className="code-editor-title">Default Template</h5>
                    <div className="code-editor-container">
                      <Editor
                        width="100%"
                        height="200px"
                        language={languages[lang]?.language || lang}
                        value={languageTemplates[lang] || ""}
                        onChange={(value) =>
                          updateLanguageTemplate(lang, value)
                        }
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
                        }}
                      />
                    </div>
                  </div>

                  <div className="code-editor-item">
                    <h5 className="code-editor-title">Solution Code</h5>
                    <div className="code-editor-container">
                      <Editor
                        width="100%"
                        height="200px"
                        language={languages[lang]?.language || lang}
                        value={languageSolutions[lang] || ""}
                        onChange={(value) =>
                          updateLanguageSolution(lang, value)
                        }
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
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Checking Method Section */}
          <div className="form-section">
            <h3 className="section-title">Checking Method</h3>
            <div className="checking-method-group">
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="checkingType"
                    value="ai"
                    defaultChecked
                    onChange={() => showTC(false)}
                  />
                  <span className="radio-custom"></span>
                  <div className="radio-content">
                    <h4>AI Checking (Recommended)</h4>
                    <p>Use AI to evaluate student solutions</p>
                  </div>
                </label>
              </div>

              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="checkingType"
                    value="testcase"
                    onChange={() => showTC(true)}
                  />
                  <span className="radio-custom"></span>
                  <div className="radio-content">
                    <h4>Test Case Checking</h4>
                    <p>Use predefined test cases to evaluate solutions</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Test Case Section */}
          {tc && (
            <div className="form-section">
              <h3 className="section-title">Test Cases</h3>

              <div className="form-group">
                <label htmlFor="function-name">Function Name</label>
                <input
                  id="function-name"
                  type="text"
                  placeholder="Enter the function name"
                  onChange={(e) => setFuncName(e.target.value)}
                  className="form-input"
                />
              </div>

              <AddTestCase
                tcIndex={tcIndex}
                setTCIndex={setTCIndex}
                funcName={funcName}
                answerCode={answerCode}
                setTestcases={setTestcases}
                selectedLanguage={selectedLanguage}
              />

              {testCases.length > 0 && (
                <div className="testcases-list">
                  <h4>Added Test Cases</h4>
                  {testCases.map((tc) => (
                    <div className="testcase-item" key={tc.no}>
                      <div className="testcase-content">
                        <div className="testcase-field">
                          <strong>Input:</strong> {tc.ip}
                        </div>
                        <div className="testcase-field">
                          <strong>Input Type:</strong> {tc.ipType}
                        </div>
                        <div className="testcase-field">
                          <strong>Expected Output:</strong> {tc.op}
                        </div>
                      </div>
                      <button
                        className="delete-testcase-btn"
                        onClick={() => deleteTestCase(tc.no)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit Section */}
          <div className="form-section submit-section">
            <button className="submit-question-btn" onClick={saveQuestion}>
              <span className="btn-icon">📝</span>
              Submit Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddQuestion;

function AddTestCase(props) {
  // Set default runner code based on language
  const defaultRunnerCodes = {
    c: `int main(void){
    //print the output by calling your function
}`,
    cpp: `int main() {
    //print the output by calling your function
    return 0;
}`,
    python: `# Call your function here\nif __name__ == "__main__":\n    pass\n`,
    java: `public class Main {\n    public static void main(String[] args) {\n        // Call your function here\n    }\n}`,
  };
  const [code, setCode] = useState(
    defaultRunnerCodes[props.selectedLanguage] || defaultRunnerCodes["c"]
  ); //code for running testcase
  const [saved, isSaved] = useState(false);
  const opType = useRef(0);
  const op = useRef(0);
  const ip = useRef(0);
  const ipType = useRef(0);
  const [remark, setRemark] = useState("");
  const [status, setStatus] = useState("");
  var testCaseInfo = {};

  function savetestCase() {
    //function takes the testcase and appends it to main array

    if (!code.includes(props.funcName)) {
      //check if function is added in testcase runner function

      alert("Function not in code");
      return 0;
    }

    testCaseInfo.no = props.tcIndex;
    testCaseInfo.op = op.current.value;
    testCaseInfo.opType = opType.current.value;
    testCaseInfo.ip = ip.current.value;
    testCaseInfo.ipType = ipType.current.value;
    testCaseInfo.runnercode = code;

    console.log(testCaseInfo);

    props.setTestcases((arr) => [...arr, testCaseInfo]);
    isSaved(true);
    props.setTCIndex((c) => c + 1);
  }

  async function checkTcValidity() {
    //check if testcase is valid or not
    // For test case validation, we need to create a complete program
    // that includes the function definition and a main function that calls it
    const functionDefinition = props.answerCode;
    const driverCode = code;

    // Create complete code by combining function definition with driver code
    let completeCode = "";
    if (props.selectedLanguage === "python") {
      completeCode = functionDefinition + "\n" + driverCode;
    } else {
      // For C/C++/Java, we need to ensure proper structure
      completeCode = functionDefinition + "\n" + driverCode;
    }

    console.log("Complete code for validation:", completeCode);
    setRemark("...");
    setStatus("...");

    var c = {};
    c.op = op.current.value;
    c.code = completeCode;
    c.language = props.selectedLanguage || "c";

    console.log(c);

    const res = await fetch("/api/tcvalid", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(c),
    });

    const data = await res.json();

    if (data.error) {
      setStatus("invalid");
      setRemark(data.error);
    } else {
      setStatus((r) => data.status);
    }
    console.log(data);
  }

  return (
    <div className="add-testcase-container">
      <h4 className="testcase-title">Add New Test Case</h4>

      <div className="testcase-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="testcase-input">Input (Displayed to User)</label>
            <input
              type="text"
              id="testcase-input"
              placeholder="Enter input value"
              ref={ip}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="input-type">Input Type</label>
            <select id="input-type" ref={ipType} className="form-select">
              <option value="string">String</option>
              <option value="int">int</option>
              <option value="char">char</option>
              <option value="float">float</option>
              <option value="void">void</option>
              <option value="struct">struct</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="expected-output">Expected Output</label>
            <textarea
              id="expected-output"
              placeholder="Enter expected output"
              ref={op}
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="output-type">Output Type</label>
            <select
              name="optype"
              id="output-type"
              ref={opType}
              className="form-select"
            >
              <option value="string">String</option>
              <option value="int">int</option>
              <option value="char">char</option>
              <option value="float">float</option>
              <option value="void">void</option>
              <option value="struct">struct</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="driver-code">Driver Code (Main Function)</label>
          <div className="code-editor-container">
            <Editor
              language={props.selectedLanguage}
              height="150px"
              value={code}
              onChange={(value, e) => setCode(value)}
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
              }}
            />
          </div>
        </div>

        <div className="testcase-actions">
          <button className="testcase-check-btn" onClick={checkTcValidity}>
            <span className="btn-icon">🔍</span>
            Check Test Case
          </button>
          <button className="testcase-save-btn" onClick={savetestCase}>
            <span className="btn-icon">💾</span>
            Save Test Case
          </button>
        </div>

        <div className="testcase-terminal">
          <h5>Validation Result</h5>
          <div className="terminal-content">
            <div className="terminal-status">
              <strong>Status:</strong> {status || "Not checked"}
            </div>
            {remark && (
              <div className="terminal-output">
                <strong>Output:</strong>
                <pre>{remark}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function testCaseBox(props) {
  return <></>;
}

// height="90vh"
// width={"100vh"}
// defaultLanguage="c"
// defaultValue={defValue}
// value={value}
// onChange={(value, e) => setValue((e1) => value)}
// className="editor"
