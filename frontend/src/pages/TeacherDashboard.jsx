import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import "./TeacherDashboard.css";

function TeacherDashboard() {
  const [activeSessions, setActiveSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarityResults, setSimilarityResults] = useState(null);
  const [selectedProblemForSimilarity, setSelectedProblemForSimilarity] =
    useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkTeacherAccess();
    fetchDashboardData();

    // Set up auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkTeacherAccess = async () => {
    try {
      const response = await fetch("/api/getUserInfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer " + localStorage.getItem("auth"),
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (data.data.role !== "teacher" && data.data.role !== "admin") {
        navigate("/home");
      }
    } catch (error) {
      console.error("Error checking access:", error);
      navigate("/home");
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [sessionsRes, usersRes, eventsRes] = await Promise.all([
        fetch("/api/teacher/active-sessions", {
          headers: {
            authorization: "Bearer " + localStorage.getItem("auth"),
          },
        }),
        fetch("/api/teacher/users-overview", {
          headers: {
            authorization: "Bearer " + localStorage.getItem("auth"),
          },
        }),
        fetch("/api/teacher/proctoring-events?limit=50", {
          headers: {
            authorization: "Bearer " + localStorage.getItem("auth"),
          },
        }),
      ]);

      const sessionsData = await sessionsRes.json();
      const usersData = await usersRes.json();
      const eventsData = await eventsRes.json();

      setActiveSessions(sessionsData);
      setUsers(usersData);
      setEvents(eventsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userid) => {
    try {
      const response = await fetch(`/api/teacher/user/${userid}`, {
        headers: {
          authorization: "Bearer " + localStorage.getItem("auth"),
        },
      });
      const data = await response.json();
      setUserDetails(data);
      setSelectedUser(userid);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const checkCodeSimilarity = async () => {
    if (!selectedProblemForSimilarity) {
      alert("Please select a problem to check");
      return;
    }

    try {
      const response = await fetch("/api/teacher/check-similarity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer " + localStorage.getItem("auth"),
        },
        body: JSON.stringify({
          q_id: selectedProblemForSimilarity,
        }),
      });
      const data = await response.json();
      setSimilarityResults(data);
    } catch (error) {
      console.error("Error checking similarity:", error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "#f44336";
      case "medium":
        return "#ff9800";
      case "low":
        return "#4caf50";
      default:
        return "#2196f3";
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Students</h3>
            <p className="stat-value">{users.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <h3>Active Now</h3>
            <p className="stat-value">{activeSessions.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>High Severity Events</h3>
            <p className="stat-value">
              {events.filter((e) => e.severity === "high").length}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Events</h3>
            <p className="stat-value">{events.length}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h2>🟢 Active Sessions</h2>
          {activeSessions.length === 0 ? (
            <p className="no-data">No active sessions</p>
          ) : (
            <div className="sessions-list">
              {activeSessions.map((session) => (
                <div key={session.session_id} className="session-card">
                  <div className="session-header">
                    <span className="username">{session.username}</span>
                    <span className="live-indicator">🔴 LIVE</span>
                  </div>
                  <div className="session-info">
                    <p>📝 {session.problem_name}</p>
                    <p>💻 {session.language?.toUpperCase()}</p>
                    <p>
                      ⏱️{" "}
                      {Math.round(
                        (Date.now() - new Date(session.started_at)) / 60000
                      )}{" "}
                      min ago
                    </p>
                  </div>
                  <div className="session-warnings">
                    {session.tab_switches > 0 && (
                      <span className="warning-badge">
                        🔄 {session.tab_switches} tab switches
                      </span>
                    )}
                    {session.copy_paste_count > 0 && (
                      <span className="warning-badge">
                        📋 {session.copy_paste_count} pastes
                      </span>
                    )}
                  </div>
                  <button
                    className="view-user-btn"
                    onClick={() => {
                      fetchUserDetails(session.user_id);
                      setSelectedTab("users");
                    }}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <h2>🚨 Recent Events</h2>
          {events.length === 0 ? (
            <p className="no-data">No recent events</p>
          ) : (
            <div className="events-list">
              {events.slice(0, 10).map((event) => (
                <div
                  key={event.event_id}
                  className="event-item"
                  style={{ borderLeftColor: getSeverityColor(event.severity) }}
                >
                  <div className="event-header">
                    <span className="event-user">{event.username}</span>
                    <span className="event-time">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  <div className="event-type">{event.event_type}</div>
                  <div className="event-details">{event.event_details}</div>
                  {event.qname && (
                    <div className="event-problem">Problem: {event.qname}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="users-section">
      {selectedUser && userDetails ? (
        <div className="user-details-view">
          <button
            className="back-button"
            onClick={() => {
              setSelectedUser(null);
              setUserDetails(null);
            }}
          >
            ← Back to Users
          </button>

          <div className="user-detail-header">
            <h2>👤 {userDetails.user.username}</h2>
            <p>{userDetails.user.email}</p>
          </div>

          <div className="user-stats-grid">
            <div className="user-stat">
              <h4>Problems Solved</h4>
              <p>{userDetails.solved.length}</p>
            </div>
            <div className="user-stat">
              <h4>Sessions</h4>
              <p>{userDetails.sessions.length}</p>
            </div>
            <div className="user-stat">
              <h4>Events</h4>
              <p>{userDetails.events.length}</p>
            </div>
          </div>

          <div className="user-detail-section">
            <h3>Recent Sessions</h3>
            {userDetails.sessions.map((session) => (
              <div key={session.session_id} className="detail-card">
                <p>
                  <strong>Problem:</strong> {session.problem_name}
                </p>
                <p>
                  <strong>Language:</strong> {session.language}
                </p>
                <p>
                  <strong>Started:</strong>{" "}
                  {formatTimestamp(session.started_at)}
                </p>
                <p>
                  <strong>Tab Switches:</strong> {session.tab_switches}
                </p>
                <p>
                  <strong>Copy/Paste:</strong> {session.copy_paste_count}
                </p>
              </div>
            ))}
          </div>

          <div className="user-detail-section">
            <h3>Proctoring Events</h3>
            {userDetails.events.map((event) => (
              <div
                key={event.event_id}
                className="detail-card"
                style={{ borderLeftColor: getSeverityColor(event.severity) }}
              >
                <p>
                  <strong>{event.event_type}</strong>
                </p>
                <p>{event.event_details}</p>
                <p className="event-timestamp">
                  {formatTimestamp(event.timestamp)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="users-table-container">
          <h2>👥 All Students</h2>
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Solved</th>
                <th>Active</th>
                <th>Tab Switches</th>
                <th>Copy/Paste</th>
                <th>High Alerts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.userid}
                  className={user.high_severity_events > 0 ? "suspicious" : ""}
                >
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.problems_solved}</td>
                  <td>{user.active_now > 0 ? "🟢" : "⚪"}</td>
                  <td>{user.total_tab_switches || 0}</td>
                  <td>{user.total_copy_pastes || 0}</td>
                  <td>
                    {user.high_severity_events > 0 && (
                      <span className="alert-badge">
                        ⚠️ {user.high_severity_events}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => fetchUserDetails(user.userid)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSimilarity = () => (
    <div className="similarity-section">
      <h2>🔍 Code Similarity Detection</h2>
      <div className="similarity-controls">
        <input
          type="number"
          placeholder="Enter Problem ID"
          value={selectedProblemForSimilarity}
          onChange={(e) => setSelectedProblemForSimilarity(e.target.value)}
          className="similarity-input"
        />
        <button onClick={checkCodeSimilarity} className="check-btn">
          Check Similarity
        </button>
      </div>

      {similarityResults && (
        <div className="similarity-results">
          <h3>Results</h3>
          <p>Total Submissions: {similarityResults.total_submissions}</p>
          <p>
            Suspicious Pairs Found: {similarityResults.suspicious_pairs.length}
          </p>

          {similarityResults.suspicious_pairs.length > 0 && (
            <div className="suspicious-pairs">
              {similarityResults.suspicious_pairs.map((pair, index) => (
                <div key={index} className="pair-card">
                  <div className="pair-header">
                    <h4>Suspicious Pair #{index + 1}</h4>
                    <span className="similarity-score">
                      {(pair.similarity * 100).toFixed(1)}% Similar
                    </span>
                  </div>
                  <div className="pair-users">
                    <span>
                      👤 {pair.user1} (ID: {pair.user1_id})
                    </span>
                    <span>↔️</span>
                    <span>
                      👤 {pair.user2} (ID: {pair.user2_id})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderEvents = () => (
    <div className="events-section">
      <h2>📊 All Proctoring Events</h2>
      <div className="events-full-list">
        {events.map((event) => (
          <div
            key={event.event_id}
            className="event-card-full"
            style={{ borderLeftColor: getSeverityColor(event.severity) }}
          >
            <div className="event-card-header">
              <div>
                <h4>{event.username}</h4>
                <p className="event-email">{event.email}</p>
              </div>
              <span
                className="severity-badge"
                style={{ backgroundColor: getSeverityColor(event.severity) }}
              >
                {event.severity}
              </span>
            </div>
            <div className="event-card-body">
              <p>
                <strong>Type:</strong> {event.event_type}
              </p>
              <p>
                <strong>Details:</strong> {event.event_details}
              </p>
              {event.qname && (
                <p>
                  <strong>Problem:</strong> {event.qname}
                </p>
              )}
              <p className="event-timestamp">
                {formatTimestamp(event.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="teacher-dashboard">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <Navbar />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>🎓 Teacher Dashboard</h1>
          <p>Monitor student activity and proctoring events in real-time</p>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`tab ${selectedTab === "overview" ? "active" : ""}`}
            onClick={() => setSelectedTab("overview")}
          >
            📊 Overview
          </button>
          <button
            className={`tab ${selectedTab === "users" ? "active" : ""}`}
            onClick={() => setSelectedTab("users")}
          >
            👥 Students
          </button>
          <button
            className={`tab ${selectedTab === "events" ? "active" : ""}`}
            onClick={() => setSelectedTab("events")}
          >
            🚨 Events
          </button>
          <button
            className={`tab ${selectedTab === "similarity" ? "active" : ""}`}
            onClick={() => setSelectedTab("similarity")}
          >
            🔍 Plagiarism
          </button>
        </div>

        <div className="dashboard-content">
          {selectedTab === "overview" && renderOverview()}
          {selectedTab === "users" && renderUsers()}
          {selectedTab === "events" && renderEvents()}
          {selectedTab === "similarity" && renderSimilarity()}
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
