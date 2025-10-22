import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import "./Home.css";

function Home() {
  const [username, setUserName] = useState("nobody");
  const [islogged, setLogged] = useState(false);
  const [chartInfo, setChartInfo] = useState([]);
  const [profileInfo, setprofileInfo] = useState([]);
  const [bcolor, setbcolor] = useState("#ffe840");
  const [myRank, setMyrank] = useState("...");
  const [leaders, setLdrs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("auth")) {
      setLogged(true);
    } else {
      setLogged(false);
    }
  }, []);

  useEffect(() => {
    function checkLogged() {
      if (localStorage.getItem("auth")) {
        return true;
      } else {
        return false;
      }
    }

    async function getDetails() {
      console.log(localStorage.getItem("auth"));

      const resp = await fetch("/api/getUserInfo", {
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
      setUserName(data.data.username);

      // Redirect teachers to their dashboard
      if (data.data.role === "teacher" || data.data.role === "admin") {
        navigate("/teacher-dashboard");
        return;
      }
    }

    if (checkLogged()) {
      getDetails();
      getChartInfo();
      getUserDetails();
      getRank();
    } else {
      setUserName("Welcome to logicode!");
    }

    async function getChartInfo() {
      console.log("lets get chart info");
      const res = await fetch("/api/getchartinfo", {
        headers: {
          "Content-type": "application/json",
          authorization: "Bearer " + localStorage.getItem("auth"),
        },
      });

      const data = await res.json();
      console.log(data);
      setChartInfo(data);
    }

    async function getUserDetails() {
      const resp = await fetch("/api/getprofileInfo", {
        headers: {
          authorization: "Bearer " + localStorage.getItem("auth"),
        },
      });
      const data = await resp.json();
      console.log("Profile data is", data);
      setprofileInfo(data);
      console.log(profileInfo);

      if (profileInfo[0]) {
        const p = Math.round(
          (profileInfo[0].solved / profileInfo[0].total) * 100
        );
        if (p == 0) {
          setbcolor("#ff4545");
        } else if (p == 100) {
          setbcolor("lightgreen");
        }
      }
    }
  }, [islogged]);

  useEffect(() => {
    leaders.map((p) => {
      if (p.username == username) {
        setMyrank(leaders.indexOf(p) + 1);
      }
    });
  }, [leaders]);

  function logout() {
    localStorage.removeItem("auth");
    console.log("Imma logout");
    setLogged(false);
  }

  async function getRank() {
    const resp = await fetch("/api/getleaders", {
      headers: {
        "Content-type": "application/json",
        authorization: "Bearer " + localStorage.getItem("auth"),
      },
    });

    const data = await resp.json();
    // data.leaders.map((p)=>{
    //   if (p.username == username) {
    //     setMyrank(leaders.indexOf(person)+1)
    //   }
    // })

    console.log("leaders ", data);
    setLdrs(data.leaders);
    console.log(username);
  }

  //info needed for dashboard:
  //solved, total, solved by each category

  const progressbarwidth = 400;

  return (
    <div className="home-container">
      <div className="home-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <Navbar />

      <div className="home-content">
        <div className="welcome-section">
          <h1 className="welcome-title">
            {islogged ? `Welcome back, ${username}!` : "Welcome to LogiCode"}
          </h1>
          <p className="welcome-subtitle">
            {islogged
              ? "Ready to continue your coding journey?"
              : "Start your coding journey with AI-powered learning"}
          </p>

          {!islogged && (
            <div className="auth-prompt">
              <p className="auth-text">Please login to start coding!</p>
              <button
                className="auth-button"
                onClick={() => navigate("/login")}
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {islogged && (
          <div className="dashboard-cards">
            <div className="dashboard-card profile-card">
              <div className="card-header">
                <h3 className="card-title">Profile</h3>
                <div className="card-icon">👤</div>
              </div>
              <div className="card-content">
                <p className="card-description">View and edit your profile</p>
                <Link to="/profile" className="card-link">
                  View Profile →
                </Link>
              </div>
            </div>

            <div className="dashboard-card problems-card">
              <div className="card-header">
                <h3 className="card-title">Problems</h3>
                <div className="card-icon">💻</div>
              </div>
              <div className="card-content">
                {profileInfo[0] && (
                  <div className="progress-section">
                    <div className="progress-info">
                      <span className="progress-text">
                        {Math.round(
                          (profileInfo[0].solved / profileInfo[0].total) * 100
                        )}
                        % solved
                      </span>
                      <span className="progress-detail">
                        {profileInfo[0].solved} of {profileInfo[0].total}{" "}
                        problems
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.round(
                            (profileInfo[0].solved / profileInfo[0].total) * 100
                          )}%`,
                          backgroundColor: bcolor,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                <Link to="/problems/all" className="card-link">
                  Start Coding →
                </Link>
              </div>
            </div>

            <div className="dashboard-card leaderboard-card">
              <div className="card-header">
                <h3 className="card-title">Leaderboard</h3>
                <div className="card-icon">🏆</div>
              </div>
              <div className="card-content">
                <div className="rank-section">
                  <div className="rank-number">{myRank}</div>
                  <div className="rank-label">Your Rank</div>
                </div>
                <Link to="/leaderboard" className="card-link">
                  View Rankings →
                </Link>
              </div>
            </div>
          </div>
        )}

        {islogged && <Statsdiv chartInfo={chartInfo} />}

        <div className="problems-section">
          <h2 className="section-title">Practice Problems</h2>
          <p className="section-subtitle">
            Choose a category to start practicing
          </p>

          <div className="problem-categories">
            <Link className="category-card" to="/problems/array">
              <div className="category-icon">📊</div>
              <h3 className="category-title">Array</h3>
              <p className="category-description">
                Master array operations and algorithms
              </p>
            </Link>

            <Link className="category-card" to="/problems/stack">
              <div className="category-icon">📚</div>
              <h3 className="category-title">Stack</h3>
              <p className="category-description">Learn LIFO data structure</p>
            </Link>

            <Link className="category-card" to="/problems/queue">
              <div className="category-icon">🚶</div>
              <h3 className="category-title">Queue</h3>
              <p className="category-description">Master FIFO data structure</p>
            </Link>

            <Link className="category-card" to="/problems/linkedlist">
              <div className="category-icon">🔗</div>
              <h3 className="category-title">Linked List</h3>
              <p className="category-description">Dynamic data structures</p>
            </Link>

            <Link className="category-card" to="/problems/tree">
              <div className="category-icon">🌳</div>
              <h3 className="category-title">Tree</h3>
              <p className="category-description">
                Hierarchical data structures
              </p>
            </Link>

            <Link className="category-card" to="/problems/graph">
              <div className="category-icon">🕸️</div>
              <h3 className="category-title">Graph</h3>
              <p className="category-description">
                Network and graph algorithms
              </p>
            </Link>

            <Link className="category-card" to="/problems/algorithm">
              <div className="category-icon">⚡</div>
              <h3 className="category-title">Algorithm</h3>
              <p className="category-description">
                Advanced algorithmic problems
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

function Statsdiv(props) {
  return (
    <div className="stats-section">
      <h2 className="section-title">My Progress</h2>
      <p className="section-subtitle">
        Track your performance across different categories
      </p>

      <div className="stats-grid">
        {props.chartInfo.map((solType) => {
          return (
            <Link
              key={solType.qtype}
              to={"/problems/" + solType.qtype}
              className="stat-card"
            >
              <Stats solType={solType} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stats({ solType }) {
  const [color, setcolor] = useState("#667eea");
  const number = Math.round((solType.usercount / solType.qcount) * 100);

  useEffect(() => {
    if (number < 33) {
      setcolor("#ff4545");
    } else if (number < 66) {
      setcolor("#ffe840");
    } else {
      setcolor("#34c759");
    }
  }, [number]);

  const dos = 590 * (1 - solType.usercount / solType.qcount);

  return (
    <div className="stat-item">
      <div className="stat-header">
        <h4 className="stat-category">{solType.qtype}</h4>
        <div className="stat-percentage" style={{ color: color }}>
          {number}%
        </div>
      </div>

      <div className="stat-progress">
        <div className="progress-circle">
          <svg className="progress-svg" width="80" height="80">
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 35}`}
              strokeDashoffset={dos}
              transform="rotate(-90 40 40)"
            />
          </svg>
          <div className="progress-text">{number}%</div>
        </div>
      </div>

      <div className="stat-details">
        <span className="stat-solved">{solType.usercount} solved</span>
        <span className="stat-total">of {solType.qcount} problems</span>
      </div>
    </div>
  );
}
