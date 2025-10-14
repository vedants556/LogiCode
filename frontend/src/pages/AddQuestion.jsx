import React, { useRef, useState } from "react";
import Editor from "@monaco-editor/react";

function AddQuestion() {
  const timerRef = useRef(); // timer in minutes
  const [tc, showTC] = useState(false); //if the user wants check by testcase or not
  const [tcIndex, setTCIndex] = useState(0); //current testcase index
  const [testCases, setTestcases] = useState([]); //array to store testcases
  const [defaultCode, setDefCode] = useState(""); //default code of question
  const [funcName, setFuncName] = useState(); //function name
  const [answerCode, setAnsCode] = useState(""); //solution
  const [selectedLanguage, setSelectedLanguage] = useState("c"); //selected language
  const [languages, setLanguages] = useState({}); //available languages

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
      if (data[selectedLanguage]) {
        setDefCode(data[selectedLanguage].defaultCode);
        setAnsCode(data[selectedLanguage].defaultCode);
      } else {
        setDefCode(data["c"].defaultCode);
        setAnsCode(data["c"].defaultCode);
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
    <>
      <div className="addQuestionForm">
        <label htmlFor="timer-input">Time Limit (minutes):</label>
        <input
          id="timer-input"
          type="number"
          min="0"
          placeholder="Enter time in minutes (0 for no limit)"
          ref={timerRef}
          style={{ marginBottom: "12px", width: "200px", padding: "6px" }}
        />
        <h1>Add question</h1>
        <input
          type="text"
          className="addQuestionText"
          name=""
          id=""
          placeholder="Problem Name"
          ref={qname}
        />

        <select name="problemDomain" ref={qtype} id="">
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

        <textarea
          name=""
          className="addQuestionText"
          id=""
          placeholder="Add a description (markdown supported). Add testcases and examples too"
          rows={15}
          ref={desc}
        ></textarea>

        <h4>Default code which user will see</h4>
        <Editor
          width={"60%"}
          height={"20vh"}
          language={languages[selectedLanguage]?.language || "c"}
          value={defaultCode}
          onChange={(value, e) => {
            setDefCode((c) => value);
          }}
        />

        <h4>Solution</h4>
        <Editor
          width={"60%"}
          height={"20vh"}
          language={languages[selectedLanguage]?.language || "c"}
          value={answerCode}
          onChange={(value, e) => {
            setAnsCode((c) => value);
          }}
        />

        <h4>Checking method</h4>
        <div className="selectCheckType">
          <span className="radioButtonSpan">
            <label>check Using AI (default) </label>
            <input
              type="radio"
              name="chackingType"
              id=""
              onClick={() => {
                showTC(false);
              }}
            />
          </span>

          <span className="radioButtonSpan">
            <label>check Using Testcases</label>
            <input
              type="radio"
              name="chackingType"
              id=""
              onClick={() => {
                showTC(true);
              }}
            />
          </span>
        </div>

        <button className="submitQuestion" onClick={saveQuestion}>
          Submit question
        </button>

        {tc && (
          <span>
            {" "}
            <h4>Enter the name of the function</h4>{" "}
            <input
              style={{ width: "400px" }}
              type="text"
              placeholder="Enter the function name"
              onChange={(e) => {
                setFuncName(e.target.value);
              }}
            ></input>{" "}
          </span>
        )}
        {tc && (
          <AddTestCase
            tcIndex={tcIndex}
            setTCIndex={setTCIndex}
            funcName={funcName}
            answerCode={answerCode}
            setTestcases={setTestcases}
            selectedLanguage={selectedLanguage}
          />
        )}

        {tc && (
          <div className="tcRoll">
            <p>Testcases: </p>
            {testCases.map((tc) => {
              return (
                <div className="tcs" key={tc.no}>
                  <ul>
                    <li>Input : {tc.ip}</li>
                    <li>Input Type: {tc.ipType}</li>
                    <li>Expected Output: {tc.op}</li>
                  </ul>
                  <button
                    className="deletetc"
                    onClick={() => deleteTestCase(tc.no)}
                  >
                    Delete testcase
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
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
    const fcode = props.answerCode + "\n" + code;
    console.log(fcode);
    setRemark("...");
    setStatus("...");

    var c = {};
    c.op = op.current.value;
    c.code = fcode;
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
    <div className="testCases">
      <h3>Add Testcase</h3>
      <p>Input (To be displayed)</p>
      <input
        type="text"
        placeholder="input (to be displayed in testcase"
        ref={ip}
      />
      <select type="text" placeholder="ip type" ref={ipType}>
        <option value="string">String</option>
        <option value="int">int</option>
        <option value="char">char</option>
        <option value="float">float</option>
        <option value="void">void</option>
        <option value="struct">struct</option>
      </select>
      <br />
      <p>Expected output</p>
      <textarea type="text" placeholder="desired output" ref={op} />
      <select name="optype" id="optype" ref={opType}>
        <option value="string">String</option>
        <option value="int">int</option>
        <option value="char">char</option>
        <option value="float">float</option>
        <option value="void">void</option>
        <option value="struct">struct</option>
      </select>
      <br />
      <p>Driver code (int main function) </p>
      <Editor
        language={props.selectedLanguage}
        height={"20vh"}
        value={code}
        onChange={(value, e) => setCode(value)}
      />
      <button className="testcasecheckbutton" onClick={checkTcValidity}>
        check testcase
      </button>
      <button className="testcasecheckbutton" onClick={savetestCase}>
        save
      </button>
      <p>Admin's terminal</p>
      <div className="terminal">
        <p>{status}</p>
        <pre>{remark}</pre>
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
