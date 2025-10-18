import "./registration.css";
import Logo from "../components/Logo/Logo";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Registration({ initialMode }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confP, setConfPass] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (initialMode === "login") {
      setIsSignUp(false);
    } else if (initialMode === "signup") {
      setIsSignUp(true);
    }
  }, [initialMode]);

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setEmail("");
    setUsername("");
    setPassword("");
    setConfPass("");
  };

  const validateForm = () => {
    if (isSignUp) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      if (isSignUp) {
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
          setIsSignUp(false);
          setUsername("");
          setPassword("");
          setEmail("");
          setConfPass("");
        } else {
          setError(data.error || "Signup failed");
        }
      } else {
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
      }
    } catch (error) {
      setError(
        isSignUp
          ? "Signup failed. Please try again."
          : "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Logo />
      <div className="auth-container">
        <div className="auth-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="auth-subtitle">
              {isSignUp
                ? "Join our community and start your journey"
                : "Sign in to continue to your account"}
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
            {isSignUp && (
              <div className="input-groupp">
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="auth-input"
                    required
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
                  required
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
                  required
                />
              </div>
            </div>

            {isSignUp && (
              <div className="input-groupp">
                <div className="input-wrapper">
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confP}
                    onChange={(e) => setConfPass(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`auth-button ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading
                ? "Processing..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </button>
          </form>

          <div className="auth-toggle">
            <button
              className={`toggle-button ${!isSignUp ? "active" : ""}`}
              onClick={() => toggleForm()}
            >
              Sign In
            </button>
            <button
              className={`toggle-button ${isSignUp ? "active" : ""}`}
              onClick={() => toggleForm()}
            >
              Sign Up
            </button>
          </div>

          <div className="auth-footer">
            <p className="toggle-message">
              {isSignUp
                ? "Already have an account? Sign in above!"
                : "Don't have an account? Sign up above!"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Registration;
