import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import "./TeacherDashboard.css";

function TeacherDashboard() {
  const [activeSessions, setActiveSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarityResults, setSimilarityResults] = useState(null);
  const [selectedProblemForSimilarity, setSelectedProblemForSimilarity] =
    useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [allPlagiarismResults, setAllPlagiarismResults] = useState([]);
  const [loadingPlagiarism, setLoadingPlagiarism] = useState(false);

  // Event filtering states
  const [eventFilter, setEventFilter] = useState({
    search: "",
    severity: "all",
    sortBy: "time",
  });

  // Submission filtering states
  const [submissionFilter, setSubmissionFilter] = useState({
    search: "",
    language: "all",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 20;
  const submissionsPerPage = 15;

  const navigate = useNavigate();

  useEffect(() => {
    checkTeacherAccess();
    fetchDashboardData();

    // Set up auto-refresh every 2 seconds for real-time updates
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 2000);

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
      const [sessionsRes, usersRes, eventsRes, statsRes, submissionsRes] =
        await Promise.all([
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
          fetch("/api/teacher/proctoring-events?limit=200", {
            headers: {
              authorization: "Bearer " + localStorage.getItem("auth"),
            },
          }),
          fetch("/api/teacher/dashboard-stats", {
            headers: {
              authorization: "Bearer " + localStorage.getItem("auth"),
            },
          }),
          fetch("/api/teacher/code-submissions?limit=200", {
            headers: {
              authorization: "Bearer " + localStorage.getItem("auth"),
            },
          }),
        ]);

      const sessionsData = await sessionsRes.json();
      const usersData = await usersRes.json();
      const eventsData = await eventsRes.json();
      const statsData = await statsRes.json();
      const submissionsData = await submissionsRes.json();

      setActiveSessions(sessionsData);
      setUsers(usersData);
      setEvents(eventsData);
      setDashboardStats(statsData);
      setSubmissions(submissionsData);
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

  const clearUserProctoringEvents = async (userid) => {
    if (
      !confirm(
        "Are you sure you want to clear all proctoring events for this student?"
      )
    ) {
      return;
    }

    try {
      // Show loading state
      setLoading(true);

      const response = await fetch(
        `/api/teacher/clear-proctoring-events/${userid}`,
        {
          method: "DELETE",
          headers: {
            authorization: "Bearer " + localStorage.getItem("auth"),
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        // Immediately update the state to show no events
        if (userDetails && userDetails.user.userid === userid) {
          setUserDetails({
            ...userDetails,
            events: [],
          });
        }

        // Clear events from the main events list for this user
        setEvents((prevEvents) =>
          prevEvents.filter((e) => e.user_id !== userid)
        );

        // Refresh dashboard data in background
        await fetchDashboardData();

        setLoading(false);
        // Show success message after data is refreshed
        alert(data.message);
      } else {
        setLoading(false);
        alert("Error clearing events: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      setLoading(false);
      console.error("Error clearing proctoring events:", error);
      alert("Failed to clear proctoring events");
    }
  };

  const clearAllProctoringEvents = async () => {
    if (
      !confirm(
        "⚠️ WARNING: This will permanently delete ALL proctoring events for ALL students. Are you absolutely sure?"
      )
    ) {
      return;
    }

    // Double confirmation for this critical action
    if (
      !confirm(
        "Last chance! Type OK in your mind and click OK to proceed with deleting ALL proctoring events."
      )
    ) {
      return;
    }

    try {
      // Show loading state
      setLoading(true);

      const response = await fetch("/api/teacher/clear-all-proctoring-events", {
        method: "DELETE",
        headers: {
          authorization: "Bearer " + localStorage.getItem("auth"),
        },
      });
      const data = await response.json();

      if (data.success) {
        // Immediately clear all events from state
        setEvents([]);

        // If viewing a specific user, clear their events too
        if (userDetails) {
          setUserDetails({
            ...userDetails,
            events: [],
          });
        }

        // Refresh dashboard data in background
        await fetchDashboardData();

        setLoading(false);
        // Show success message after data is refreshed
        alert(`✅ ${data.message}`);
      } else {
        setLoading(false);
        alert("Error clearing events: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      setLoading(false);
      console.error("Error clearing all proctoring events:", error);
      alert("Failed to clear all proctoring events");
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

  const fetchAllPlagiarismReport = async () => {
    setLoadingPlagiarism(true);
    try {
      const response = await fetch("/api/teacher/plagiarism-report", {
        headers: {
          authorization: "Bearer " + localStorage.getItem("auth"),
        },
      });
      const data = await response.json();
      setAllPlagiarismResults(data);
    } catch (error) {
      console.error("Error fetching plagiarism report:", error);
    } finally {
      setLoadingPlagiarism(false);
    }
  };

  // Auto-fetch plagiarism report when similarity tab is selected
  useEffect(() => {
    if (selectedTab === "similarity") {
      fetchAllPlagiarismReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

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

  // Parse MySQL timestamp (YYYY-MM-DD HH:MM:SS) to local Date object
  const parseMySQLTimestamp = (timestamp) => {
    if (!timestamp) return null;

    // MySQL timestamps are usually in server's local time
    // If it's already an ISO string or Date object, use it directly
    if (timestamp instanceof Date) return timestamp;

    // Handle MySQL format: "YYYY-MM-DD HH:MM:SS"
    // Replace space with 'T' and add 'Z' to treat as UTC if needed
    // But actually, we should treat it as local server time
    const date = new Date(timestamp);

    return isNaN(date.getTime()) ? null : date;
  };

  const formatTimestamp = (timestamp) => {
    const date = parseMySQLTimestamp(timestamp);

    if (!date) return "Invalid date";

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getTimeAgo = (timestamp) => {
    const past = parseMySQLTimestamp(timestamp);

    if (!past) return "N/A";

    const now = new Date();
    const diffMs = now - past;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Handle negative time differences (future dates)
    if (diffSecs < 0) return "just now";

    if (diffSecs < 10) return "just now";
    if (diffSecs < 60) return `${diffSecs} sec ago`;
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Students</h3>
            <p className="stat-value">{dashboardStats?.total_students || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <h3>Active Now</h3>
            <p className="stat-value">{dashboardStats?.active_students || 0}</p>
            <p className="stat-subtitle">
              {dashboardStats?.active_sessions || 0} sessions
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>High Severity (Today)</h3>
            <p className="stat-value">
              {dashboardStats?.high_severity_today || 0}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Events (Today)</h3>
            <p className="stat-value">
              {dashboardStats?.total_events_today || 0}
            </p>
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
                    <p>🕐 Started: {getTimeAgo(session.started_at)}</p>
                    <p>⏱️ Active: {getTimeAgo(session.last_activity)}</p>
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
            {userDetails.sessions.length === 0 ? (
              <p className="no-data">No sessions found</p>
            ) : (
              userDetails.sessions.map((session) => (
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
              ))
            )}
          </div>

          <div className="user-detail-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3>Proctoring Events</h3>
              {userDetails.events.length > 0 && (
                <button
                  className="clear-events-btn"
                  style={{
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                  onClick={() => clearUserProctoringEvents(selectedUser)}
                >
                  🗑️ Clear All Events
                </button>
              )}
            </div>
            {userDetails.events.length === 0 ? (
              <p className="no-data">No events found</p>
            ) : (
              userDetails.events.map((event) => (
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
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="users-table-container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2>👥 All Students</h2>
            <button
              className="clear-all-events-btn"
              style={{
                backgroundColor: "#d32f2f",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#b71c1c";
                e.target.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#d32f2f";
                e.target.style.transform = "scale(1)";
              }}
              onClick={clearAllProctoringEvents}
            >
              <span style={{ fontSize: "18px" }}>🗑️</span>
              Clear All Students' Events
            </button>
          </div>
          {users.length === 0 ? (
            <div className="no-data-container">
              <p className="no-data">No students found in the system</p>
              <p className="no-data-subtitle">
                Students will appear here once they sign up with a student role
              </p>
            </div>
          ) : (
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
                    className={
                      user.high_severity_events > 0 ? "suspicious" : ""
                    }
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
          )}
        </div>
      )}
    </div>
  );

  const renderSimilarity = () => (
    <div className="similarity-section">
      <h2>🔍 Plagiarism Detection - All Submissions</h2>

      {loadingPlagiarism ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Analyzing all submissions for plagiarism...</p>
        </div>
      ) : allPlagiarismResults.length > 0 ? (
        <>
          <div className="plagiarism-summary">
            <p className="summary-text">
              📊 Found{" "}
              {allPlagiarismResults.reduce(
                (sum, problem) => sum + problem.suspicious_pairs.length,
                0
              )}{" "}
              suspicious pairs across {allPlagiarismResults.length} problem(s)
            </p>
            <button
              onClick={fetchAllPlagiarismReport}
              className="check-btn"
              style={{ marginLeft: "10px" }}
            >
              🔄 Refresh
            </button>
          </div>

          <div className="all-plagiarism-results">
            {allPlagiarismResults.map((problem, problemIndex) => (
              <div key={problem.q_id} className="problem-plagiarism-card">
                <div className="problem-header">
                  <h3>📝 {problem.qname || `Problem ${problem.q_id}`}</h3>
                  <div className="problem-stats">
                    <span>ID: {problem.q_id}</span>
                    <span>•</span>
                    <span>{problem.total_submissions} submissions</span>
                    <span>•</span>
                    <span className="suspicious-count">
                      {problem.suspicious_pairs.length} suspicious
                    </span>
                  </div>
                </div>

                <div className="suspicious-pairs">
                  {problem.suspicious_pairs.map((pair, pairIndex) => (
                    <div key={pairIndex} className="pair-card">
                      <div className="pair-header">
                        <h4>Suspicious Pair #{pairIndex + 1}</h4>
                        <span
                          className="similarity-score"
                          style={{
                            backgroundColor:
                              pair.similarity > 0.95
                                ? "#f44336"
                                : pair.similarity > 0.9
                                ? "#ff9800"
                                : "#4caf50",
                          }}
                        >
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
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="no-results">
          <p>✅ No plagiarism detected in any submissions</p>
          <button onClick={fetchAllPlagiarismReport} className="check-btn">
            🔄 Check Again
          </button>
        </div>
      )}

      <div
        className="manual-check-section"
        style={{
          marginTop: "30px",
          paddingTop: "20px",
          borderTop: "1px solid #ddd",
        }}
      >
        <h3>Manual Check by Problem ID</h3>
        <div className="similarity-controls">
          <input
            type="number"
            placeholder="Enter Problem ID"
            value={selectedProblemForSimilarity}
            onChange={(e) => setSelectedProblemForSimilarity(e.target.value)}
            className="similarity-input"
          />
          <button onClick={checkCodeSimilarity} className="check-btn">
            Check Specific Problem
          </button>
        </div>

        {similarityResults && (
          <div className="similarity-results" style={{ marginTop: "15px" }}>
            <h4>Manual Check Results</h4>
            <p>Total Submissions: {similarityResults.total_submissions}</p>
            <p>
              Suspicious Pairs Found:{" "}
              {similarityResults.suspicious_pairs.length}
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
    </div>
  );

  const renderEvents = () => {
    // Filter events based on search and severity
    const filteredEvents = events.filter((event) => {
      const matchesSearch =
        eventFilter.search === "" ||
        event.username
          .toLowerCase()
          .includes(eventFilter.search.toLowerCase()) ||
        event.event_type
          .toLowerCase()
          .includes(eventFilter.search.toLowerCase()) ||
        event.event_details
          .toLowerCase()
          .includes(eventFilter.search.toLowerCase()) ||
        (event.qname &&
          event.qname.toLowerCase().includes(eventFilter.search.toLowerCase()));

      const matchesSeverity =
        eventFilter.severity === "all" ||
        event.severity === eventFilter.severity;

      return matchesSearch && matchesSeverity;
    });

    // Sort events
    const sortedEvents = [...filteredEvents].sort((a, b) => {
      if (eventFilter.sortBy === "time") {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else if (eventFilter.sortBy === "severity") {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return (
          (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
        );
      } else if (eventFilter.sortBy === "user") {
        return a.username.localeCompare(b.username);
      }
      return 0;
    });

    // Paginate events
    const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);
    const startIdx = (currentPage - 1) * eventsPerPage;
    const paginatedEvents = sortedEvents.slice(
      startIdx,
      startIdx + eventsPerPage
    );

    // Group events by date
    const groupedEvents = paginatedEvents.reduce((groups, event) => {
      const date = new Date(event.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
      return groups;
    }, {});

    return (
      <div className="events-section">
        <div className="events-header">
          <h2>📊 All Proctoring Events</h2>
          <div className="events-controls">
            <input
              type="text"
              placeholder="Search events, users, problems..."
              value={eventFilter.search}
              onChange={(e) => {
                setEventFilter({ ...eventFilter, search: e.target.value });
                setCurrentPage(1);
              }}
              className="event-search"
            />
            <select
              value={eventFilter.severity}
              onChange={(e) => {
                setEventFilter({ ...eventFilter, severity: e.target.value });
                setCurrentPage(1);
              }}
              className="event-filter"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={eventFilter.sortBy}
              onChange={(e) =>
                setEventFilter({ ...eventFilter, sortBy: e.target.value })
              }
              className="event-sort"
            >
              <option value="time">Sort by Time</option>
              <option value="severity">Sort by Severity</option>
              <option value="user">Sort by User</option>
            </select>
          </div>
          <div className="events-stats">
            <span>Total: {events.length}</span>
            <span>Filtered: {filteredEvents.length}</span>
            <span>
              High Severity:{" "}
              {events.filter((e) => e.severity === "high").length}
            </span>
          </div>
        </div>

        {paginatedEvents.length === 0 ? (
          <p className="no-data">No events found</p>
        ) : (
          <>
            <div className="events-grouped">
              {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                <div key={date} className="event-date-group">
                  <h3 className="event-date-header">{date}</h3>
                  <div className="events-list-grid">
                    {dateEvents.map((event) => (
                      <div
                        key={event.event_id}
                        className="event-card-full"
                        style={{
                          borderLeftColor: getSeverityColor(event.severity),
                        }}
                      >
                        <div className="event-card-header">
                          <div>
                            <h4>{event.username}</h4>
                            <p className="event-email">{event.email}</p>
                          </div>
                          <span
                            className="severity-badge"
                            style={{
                              backgroundColor: getSeverityColor(event.severity),
                            }}
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
                            {formatTimestamp(event.timestamp)} (
                            {getTimeAgo(event.timestamp)})
                          </p>
                        </div>
                        <button
                          className="view-user-btn-small"
                          onClick={() => {
                            fetchUserDetails(event.user_id);
                            setSelectedTab("users");
                          }}
                        >
                          View User
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderSubmissions = () => {
    // Filter submissions
    const filteredSubmissions = submissions.filter((submission) => {
      const matchesSearch =
        submissionFilter.search === "" ||
        submission.username
          .toLowerCase()
          .includes(submissionFilter.search.toLowerCase()) ||
        submission.qname
          .toLowerCase()
          .includes(submissionFilter.search.toLowerCase());

      const matchesLanguage =
        submissionFilter.language === "all" ||
        submission.language === submissionFilter.language;

      return matchesSearch && matchesLanguage;
    });

    // Paginate submissions
    const totalPages = Math.ceil(
      filteredSubmissions.length / submissionsPerPage
    );
    const startIdx = (currentPage - 1) * submissionsPerPage;
    const paginatedSubmissions = filteredSubmissions.slice(
      startIdx,
      startIdx + submissionsPerPage
    );

    // Get unique languages for filter
    const uniqueLanguages = [...new Set(submissions.map((s) => s.language))];

    if (selectedSubmission) {
      return (
        <div className="submission-detail-view">
          <button
            className="back-button"
            onClick={() => setSelectedSubmission(null)}
          >
            ← Back to Submissions
          </button>

          <div className="submission-detail-header">
            <h2>📝 Code Submission</h2>
            <div className="submission-meta">
              <p>
                <strong>Student:</strong> {selectedSubmission.username} (
                {selectedSubmission.email})
              </p>
              <p>
                <strong>Problem:</strong> {selectedSubmission.qname}
              </p>
              <p>
                <strong>Language:</strong>{" "}
                {selectedSubmission.language.toUpperCase()}
              </p>
              <p>
                <strong>Submitted:</strong>{" "}
                {formatTimestamp(selectedSubmission.submitted_at)} (
                {getTimeAgo(selectedSubmission.submitted_at)})
              </p>
            </div>
          </div>

          <div className="code-viewer">
            <div className="code-header">
              <span>💻 Code</span>
              <button
                className="copy-code-btn"
                onClick={() => {
                  navigator.clipboard.writeText(selectedSubmission.code);
                  alert("Code copied to clipboard!");
                }}
              >
                📋 Copy
              </button>
            </div>
            <pre className="code-content">
              <code>{selectedSubmission.code}</code>
            </pre>
          </div>
        </div>
      );
    }

    return (
      <div className="submissions-section">
        <div className="submissions-header">
          <h2>📝 Code Submissions</h2>
          <div className="submissions-controls">
            <input
              type="text"
              placeholder="Search by student or problem..."
              value={submissionFilter.search}
              onChange={(e) => {
                setSubmissionFilter({
                  ...submissionFilter,
                  search: e.target.value,
                });
                setCurrentPage(1);
              }}
              className="submission-search"
            />
            <select
              value={submissionFilter.language}
              onChange={(e) => {
                setSubmissionFilter({
                  ...submissionFilter,
                  language: e.target.value,
                });
                setCurrentPage(1);
              }}
              className="submission-filter"
            >
              <option value="all">All Languages</option>
              {uniqueLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="submissions-stats">
            <span>Total: {submissions.length}</span>
            <span>Filtered: {filteredSubmissions.length}</span>
          </div>
        </div>

        {paginatedSubmissions.length === 0 ? (
          <p className="no-data">No code submissions found</p>
        ) : (
          <>
            <div className="submissions-list">
              {paginatedSubmissions.map((submission) => (
                <div key={submission.submission_id} className="submission-card">
                  <div className="submission-card-header">
                    <div>
                      <h4>{submission.username}</h4>
                      <p className="submission-email">{submission.email}</p>
                    </div>
                    <span className="language-badge">
                      {submission.language.toUpperCase()}
                    </span>
                  </div>
                  <div className="submission-card-body">
                    <p>
                      <strong>Problem:</strong> {submission.qname}
                    </p>
                    <p>
                      <strong>Type:</strong> {submission.qtype}
                    </p>
                    <p className="submission-timestamp">
                      {formatTimestamp(submission.submitted_at)} (
                      {getTimeAgo(submission.submitted_at)})
                    </p>
                    <div className="code-preview">
                      <pre>{submission.code.substring(0, 150)}...</pre>
                    </div>
                  </div>
                  <button
                    className="view-code-btn"
                    onClick={() => setSelectedSubmission(submission)}
                  >
                    👁️ View Full Code
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

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
            className={`tab ${selectedTab === "submissions" ? "active" : ""}`}
            onClick={() => {
              setSelectedTab("submissions");
              setSelectedSubmission(null);
            }}
          >
            📝 Submissions
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
          {selectedTab === "submissions" && renderSubmissions()}
          {selectedTab === "events" && renderEvents()}
          {selectedTab === "similarity" && renderSimilarity()}
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
