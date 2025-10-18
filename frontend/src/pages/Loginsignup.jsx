import React, { useState } from "react";
import "../loginsignup.css";
import { useNavigate } from "react-router-dom";

export const Loginsignup = () => {
  const [action, setAction] = useState("Sign up");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confP, setConfPass] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleToggle = (newAction) => {
    setAction(newAction);
    setError("");
    setEmail("");
    setUsername("");
    setPassword("");
    setConfPass("");
  };

  const validateForm = () => {
    if (action === "Sign up") {
      if (!username || !password || !email || !confP) {
        setError("All fields are required");
        return false;
      }
      if (confP !== password) {
        setError("Passwords do not match");
        return false;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return false;
      }
    } else {
      if (!email || !password) {
        setError("Email and password are required");
        return false;
      }
    }
    return true;
  };

  async function login() {
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "post",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.message) {
        localStorage.setItem("auth", data.accessToken);
        navigate("/home");
      } else {
        setError("Invalid credentials");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function signup() {
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/signup", {
        method: "post",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          name: username,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.message) {
        setError("Account created! Please sign in.");
        setAction("Login");
        setUsername("");
        setPassword("");
        setEmail("");
        setConfPass("");
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (error) {
      setError("Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (action === "Login") {
      login();
    } else {
      signup();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">{action}</h1>
          <p className="auth-subtitle">
            {action === "Sign up"
              ? "Join our community and start your journey"
              : "Welcome back! Sign in to continue"}
          </p>
          <div className="auth-underline"></div>
        </div>

        {error && (
          <div
            className={`error-message ${
              error.includes("created") ? "success" : ""
            }`}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {action === "Sign up" && (
            <div className="input-groupp">
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>
          )}

          <div className="input-groupp">
            <div className="input-wrapper">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
              />
            </div>
          </div>

          <div className="input-groupp">
            <div className="input-wrapper">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
            </div>
          </div>

          {action === "Sign up" && (
            <div className="input-groupp">
              <div className="input-wrapper">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confP}
                  onChange={(e) => setConfPass(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className={`auth-button ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : action}
          </button>
        </form>

        <div className="auth-toggle">
          <button
            className={`toggle-button ${action === "Login" ? "active" : ""}`}
            onClick={() => handleToggle("Login")}
          >
            Login
          </button>
          <button
            className={`toggle-button ${action === "Sign up" ? "active" : ""}`}
            onClick={() => handleToggle("Sign up")}
          >
            Sign up
          </button>
        </div>

        <div className="auth-footer">
          <p className="toggle-message">
            {action === "Sign up"
              ? "Already have an account? Click Login above!"
              : "Don't have an account? Click Sign up above!"}
          </p>
        </div>
      </div>
    </div>
  );
};