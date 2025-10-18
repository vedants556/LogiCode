import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoAlert } from "react-icons/go";
import { IoIosAddCircleOutline } from "react-icons/io";
import { FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import Navbar from "../components/Navbar/Navbar";
import "./Profile.css";

function Profile() {
  const [islogged, setLogged] = useState(0);
  const [username, setUsername] = useState("");
  const [userid, setUserid] = useState(-1);
  const [role, setRole] = useState("user");
  const [isAdmin, setadmin] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentTab, setCurrentTab] = useState("p"); //profile info, admin settings, logout
  const [profileInfo, setProfileInfo] = useState({});
  const [useless, setUseless] = useState([]);
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [confirmdelete, setcfdelete] = useState(false);
  const [q_to_delete, setQTD] = useState(null);

  useEffect(() => {
    async function checkLogged() {
      if (localStorage.getItem("auth")) {
        setLogged(true);
        // console.log(localStorage.getItem('auth'));

        const resp = await fetch("/api/getUserInfo", {
          method: "post",
          headers: {
            "Content-type": "application/json",
            authorization: "Bearer " + localStorage.getItem("auth"),
          },
          body: JSON.stringify({}),
        });

        const data = await resp.json();
        // console.log(data);

        setUsername(data.data.username);
        setUserid(data.data.userid);
        setRole(data.data.role);

        data.data.role === "admin" ? setadmin(true) : setadmin(false);
      } else {
        setLogged(false);
        navigate("/registration");
      }
    }

    async function getProfileInfo() {
      const resp = await fetch("/api/getprofileInfo", {
        headers: {
          authorization: "Bearer " + localStorage.getItem("auth"),
        },
      });
      const data = await resp.json();
      console.log("Profile data is", data);
      setProfileInfo(data[0]);
    }

    checkLogged();
    getProfileInfo();
    getUseless();
    getProblemsToDelete();
  }, []);

  async function getUseless() {
    const resp = await fetch("/api/getuseless");
    const data = await resp.json();
    console.log("data is ", data);
    setUseless(data);
  }

  function LogOut() {
    localStorage.removeItem("auth");
    navigate("/Registration");
  }

  async function getProblemsToDelete() {
    const resp = await fetch("/api/getProblemList/all");
    const data = await resp.json();

    setProblems(data);
  }

  async function searchUser() {
    console.log(search);

    const resp = await fetch("/api/searchuser", {
      method: "post",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        query: search,
        userid: userid,
      }),
    });

    const data = await resp.json();
    console.log(data);
    setSearchResults(data);
  }

  async function deleteQuestion(qid) {
    const resp = await fetch("/api/deleteproblem/" + qid, {
      headers: {
        "Content-type": "application/json",
        authorization: "Bearer " + localStorage.getItem("auth"),
      },
    });

    const data = await resp.json();
    if (data.status === "success") {
      alert("question deleted successfully");
      setQTD(null);
      setcfdelete(false);

      getProblemsToDelete();
    }
  }

  async function makeAdmin(id) {
    console.log(id);

    const resp = await fetch("/api/makeAdmin", {
      method: "post",
      headers: {
        "Content-type": "application/json",
        authorization: "Bearer " + localStorage.getItem("auth"),
      },
      body: JSON.stringify({
        id: id,
      }),
    });

    const data = await resp.json();
    console.log(data);
  }

  return (
    <div className="profile-container">
      <div className="profile-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <Navbar />

      <div className="profile-content">
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Manage your account and settings</p>
        </div>

        <div className="profile-layout">
          <div className="profile-sidebar">
            <div className="sidebar-card">
              <button
                className={`sidebar-button ${
                  currentTab === "p" ? "active" : ""
                }`}
                onClick={() => setCurrentTab("p")}
              >
                <FiUser className="icon" />
                Profile
              </button>
              {isAdmin && (
                <button
                  className={`sidebar-button ${
                    currentTab === "a" ? "active" : ""
                  }`}
                  onClick={() => setCurrentTab("a")}
                >
                  <FiSettings className="icon" />
                  Admin
                </button>
              )}
              <button
                className="sidebar-button logout"
                onClick={() => LogOut()}
              >
                <FiLogOut className="icon" />
                Logout
              </button>
            </div>
          </div>

          <div className="profile-main">
            {currentTab === "p" && (
              <div className="profile-info-section">
                <div className="info-card">
                  <h2 className="card-title">Profile Information</h2>
                  {profileInfo.username ? (
                    <div className="info-content">
                      <div className="info-item">
                        <span className="info-label">Username:</span>
                        <span className="info-value">
                          {profileInfo.username}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{profileInfo.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Status:</span>
                        <span
                          className={`info-value status ${profileInfo.role}`}
                        >
                          {profileInfo.role}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>Loading profile information...</p>
                    </div>
                  )}
                </div>

                <div className="info-card">
                  <h2 className="card-title">Account Statistics</h2>
                  {profileInfo.username && (
                    <div className="stats-content">
                      <div className="stat-item">
                        <div className="stat-label">Problems Solved</div>
                        <div className="stat-value">
                          {profileInfo.solved} / {profileInfo.total}
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${Math.round(
                                (profileInfo.solved / profileInfo.total) * 100
                              )}%`,
                            }}
                          ></div>
                        </div>
                        <div className="progress-text">
                          {Math.round(
                            (profileInfo.solved / profileInfo.total) * 100
                          )}
                          % completed
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentTab === "a" && (
              <div className="admin-section">
                <div className="admin-card">
                  <h2 className="card-title">Admin Settings</h2>

                  <div className="admin-actions">
                    <Link to="/Add" className="admin-button primary">
                      <IoIosAddCircleOutline />
                      Add New Problem
                    </Link>
                  </div>

                  <div className="admin-section">
                    <h3 className="section-title">User Management</h3>
                    <div className="search-section">
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                      />
                      <button onClick={searchUser} className="search-button">
                        Search
                      </button>
                    </div>

                    <div className="search-results">
                      {searchResults.map((element) => (
                        <div className="user-result" key={element.userid}>
                          <div className="user-info">
                            <span className="username">{element.username}</span>
                            <span className={`user-role ${element.role}`}>
                              {element.role}
                            </span>
                          </div>
                          <button
                            className={`admin-action ${
                              element.role === "admin" ? "revoke" : "promote"
                            }`}
                            onClick={() => makeAdmin(element.userid)}
                          >
                            {element.role === "admin"
                              ? "Revoke Admin"
                              : "Make Admin"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="admin-section">
                    <h3 className="section-title">Inactive Users</h3>
                    <div className="inactive-users">
                      {useless.map((element) => (
                        <div className="inactive-user" key={element.username}>
                          {element.username}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="admin-section danger">
                    <h3 className="section-title danger">
                      <GoAlert />
                      Delete Problems
                    </h3>
                    <div className="problems-list">
                      {problems.map((p) => (
                        <div className="problem-item" key={p.q_id}>
                          <span className="problem-name">{p.qname}</span>
                          <button
                            className="delete-button"
                            onClick={() => {
                              setcfdelete(true);
                              setQTD(p);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {confirmdelete && (
          <>
            <div className="modal-overlay"></div>
            <div className="delete-modal">
              <div className="modal-header">
                <GoAlert className="warning-icon" />
                <h3>Delete Problem</h3>
              </div>
              <div className="modal-content">
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{q_to_delete?.qname}</strong>?
                </p>
                <p className="warning-text">This action cannot be undone.</p>
              </div>
              <div className="modal-actions">
                <button
                  className="modal-button danger"
                  onClick={() => deleteQuestion(q_to_delete.q_id)}
                >
                  Yes, Delete
                </button>
                <button
                  className="modal-button"
                  onClick={() => {
                    setcfdelete(false);
                    setQTD(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;
