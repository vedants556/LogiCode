import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar/Navbar";
import "./LeaderBoard.css";

function LeaderBoard() {
  const [userid, setUserId] = useState(-1);
  const [leaders, setLeaders] = useState([]);
  const [islogged, setLogged] = useState(false);
  const [rank, setRank] = useState("N/A");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function checkLogged() {
      if (localStorage.getItem("auth")) {
        setLogged(true);
        getLb();
      } else {
        setLogged(false);
        setLoading(false);
      }
    }

    async function getLb() {
      try {
        const resp = await fetch("/api/getleaders", {
          headers: {
            "Content-type": "application/json",
            authorization: "Bearer " + localStorage.getItem("auth"),
          },
        });

        const data = await resp.json();
        setLeaders(data.leaders);
        setUserId(data.me);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setLoading(false);
      }
    }
    checkLogged();
  }, []);

  useEffect(() => {
    function checkRank() {
      leaders.forEach((person, index) => {
        if (person.userid === userid) {
          setRank(index + 1);
        }
      });
    }

    if (leaders.length > 0) {
      checkRank();
    }
  }, [leaders, userid]);

  // Get top 3 for podium
  const topThree = leaders.slice(0, 3);
  const restOfLeaders = leaders.slice(3);

  // Helper function to get user initials
  const getInitials = (username) => {
    if (!username) return "?";
    const words = username.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <Navbar />

      <div className="leaderboard-content">
        <div className="leaderboard-header">
          <h1 className="leaderboard-title">🏆 Leaderboard</h1>
          <p className="leaderboard-subtitle">
            Compete with the best coders and track your progress
          </p>
        </div>

        {islogged && rank !== "N/A" && (
          <div className="my-rank-section">
            <div className="my-rank-card">
              <div className="rank-label">Your Current Rank</div>
              <div className="rank-number">#{rank}</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : leaders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏅</div>
            <h3 className="empty-title">No Rankings Yet</h3>
            <p className="empty-text">
              Be the first to solve problems and claim the top spot!
            </p>
          </div>
        ) : (
          <>
            {/* Podium for Top 3 */}
            {topThree.length > 0 && (
              <div className="podium-section">
                <div className="podium-container">
                  {/* Second Place */}
                  {topThree[1] && (
                    <div className="podium-place second">
                      <div className="podium-card">
                        <div className="podium-icon">🥈</div>
                        <div className="podium-rank">#2</div>
                        <div className="podium-username">
                          {topThree[1].username}
                        </div>
                        <div className="podium-score">
                          <div className="score-label">Problems Solved</div>
                          <div className="score-number">
                            {topThree[1].question_count}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* First Place */}
                  {topThree[0] && (
                    <div className="podium-place first">
                      <div className="podium-card">
                        <div className="podium-icon">🏆</div>
                        <div className="podium-rank">#1</div>
                        <div className="podium-username">
                          {topThree[0].username}
                        </div>
                        <div className="podium-score">
                          <div className="score-label">Problems Solved</div>
                          <div className="score-number">
                            {topThree[0].question_count}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Third Place */}
                  {topThree[2] && (
                    <div className="podium-place third">
                      <div className="podium-card">
                        <div className="podium-icon">🥉</div>
                        <div className="podium-rank">#3</div>
                        <div className="podium-username">
                          {topThree[2].username}
                        </div>
                        <div className="podium-score">
                          <div className="score-label">Problems Solved</div>
                          <div className="score-number">
                            {topThree[2].question_count}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rest of Rankings */}
            <div className="rankings-section">
              <h2 className="section-title">All Rankings</h2>
              <div className="rankings-list">
                {leaders.map((person, index) => {
                  const position = index + 1;
                  const isCurrentUser = person.userid === userid;
                  const isTopRank = position <= 10;

                  return (
                    <div
                      key={person.userid}
                      className={`ranking-item ${
                        isCurrentUser ? "highlighted" : ""
                      } ${isTopRank ? "top-rank" : ""}`}
                    >
                      <div className="ranking-position">#{position}</div>
                      <div className="ranking-info">
                        <div className="user-info">
                          <div className="user-avatar">
                            {getInitials(person.username)}
                          </div>
                          <div className="user-name">{person.username}</div>
                        </div>
                        <div className="user-stats">
                          <div className="stat-item">
                            <div className="stat-value">
                              {person.question_count}
                            </div>
                            <div className="stat-label">Solved</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LeaderBoard;
