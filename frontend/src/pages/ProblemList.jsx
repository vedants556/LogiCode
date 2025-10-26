import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SiTicktick } from "react-icons/si";
import { CircleCheckBig } from "lucide-react";
import Navbar from "../components/Navbar/Navbar";
import "./ProblemList.css";

function ProblemList() {
  const type = useParams().type;
  console.log(type);

  const [problist, setProbList] = useState([]);
  const [solvedList, setSolvedList] = useState([]);
  const [isLogged, setLogged] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    function checkLogged() {
      if (localStorage.getItem("auth")) {
        setLogged(true);
      } else {
        setLogged(false);
        // navigate('../../login')
      }
    }

    async function getProbList() {
      console.log("Getting problem list...");

      const response = await fetch("/api/getProblemList/" + type);
      const data = await response.json();

      setProbList(data);
    }

    async function getSolvedList() {
      //dummy user id

      if (isLogged) {
        const resp = await fetch("/api/getSolvedProblems", {
          method: "post",
          headers: {
            "Content-type": "application/json",
            authorization: "Bearer " + localStorage.getItem("auth"),
          },
          body: JSON.stringify({
            authToken: localStorage.getItem("auth"),
          }),
        });
        const data = await resp.json();

        console.log(data);
        setSolvedList(data.quids);
      } else {
        const navigate = useNavigate();
        alert("not logged in");
      }
    }

    checkLogged();
    getProbList();
    getSolvedList();
  }, []);

  console.log(problist);
  console.log(solvedList);

  return (
    <div className="problemlist-container">
      <div className="problemlist-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <Navbar />

      <div className="problemlist-content">
        <div className="problemlist-header">
          <h1 className="problemlist-title">
            {type.charAt(0).toUpperCase() + type.slice(1)} Problems
          </h1>
          <p className="problemlist-subtitle">
            Practice {type} problems and improve your coding skills
          </p>
        </div>

        {!isLogged && (
          <div className="auth-prompt">
            <div className="auth-card">
              <div className="auth-icon">🔒</div>
              <h3 className="auth-title">Login Required</h3>
              <p className="auth-text">
                Please login to start coding and track your progress!
              </p>
              <button
                className="auth-button"
                onClick={() => navigate("/login")}
              >
                Login Now
              </button>
            </div>
          </div>
        )}

        {isLogged && (
          <div className="problems-section">
            <div className="problems-stats">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <div className="stat-number">{problist.length}</div>
                  <div className="stat-label">Total Problems</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <div className="stat-number">{solvedList.length}</div>
                  <div className="stat-label">Solved</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <div className="stat-number">
                    {problist.length > 0
                      ? Math.round((solvedList.length / problist.length) * 100)
                      : 0}
                    %
                  </div>
                  <div className="stat-label">Progress</div>
                </div>
              </div>
            </div>

            <div className="problems-grid">
              {problist.map((problem) => {
                const isSolved = solvedList.includes(problem.q_id);
                return (
                  <Link
                    className={`problem-card ${isSolved ? "solved" : ""}`}
                    to={"/problem/" + problem.q_id}
                    key={problem.q_id}
                  >
                    <div className="problem-header">
                      <div className="problem-title">{problem.qname}</div>
                      <div className="problem-status">
                        {isSolved ? (
                          <div className="solved-badge">
                            <SiTicktick className="tick-icon" />
                            <span>Solved</span>
                          </div>
                        ) : (
                          <div className="unsolved-badge">
                            <CircleCheckBig className="circle-icon" />
                            <span>Unsolved</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="problem-meta">
                      <div className="problem-type">
                        <span className="type-label">Category:</span>
                        <span className="type-value">{problem.qtype}</span>
                      </div>
                      <div className="problem-language">
                        <span className="language-label">Language:</span>
                        <span className="language-value">
                          {problem.selected_languages &&
                          problem.selected_languages.length > 0
                            ? problem.selected_languages
                                .join(", ")
                                .toUpperCase()
                            : "C"}
                        </span>
                      </div>
                      <div className="problem-timer">
                        <span className="timer-label">Time Limit:</span>
                        <span className="timer-value">
                          {problem.timer && problem.timer > 0
                            ? `${problem.timer} min`
                            : "No limit"}
                        </span>
                      </div>
                    </div>

                    <div className="problem-footer">
                      <div className="problem-arrow">→</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemList;
