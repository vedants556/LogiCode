import { useEffect, useState } from "react";
import "./Navbar.css";
import { Link } from "react-router-dom";
import { Menu, X, Code, User, LogOut } from "lucide-react";

const Navbar = () => {
  const [islogged, setLogged] = useState(false);
  const [username, setUsername] = useState("");
  const [showSidebar, setSidebar] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    async function checkLogged() {
      if (localStorage.getItem("auth")) {
        setLogged(true);
        console.log(localStorage.getItem("auth"));

        const resp = await fetch("/api/getUserInfo", {
          method: "post",
          headers: {
            "Content-type": "application/json",
            authorization: "Bearer " + localStorage.getItem("auth"),
          },
          body: JSON.stringify({}),
        });

        const data = await resp.json();
        console.log(data);

        setUsername(data.data.username);
      } else {
        setLogged(false);
      }
    }

    checkLogged();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    setLogged(false);
    setUsername("");
    setSidebar(false);
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setSidebar(false);
  };

  return (
    <>
      <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <div className="nav-brand">
            <Link to="/" className="brand-link">
              <Code className="brand-icon" />
              <span className="brand-text">logicode</span>
            </Link>
          </div>

          <div className="nav-menu">
            <ul className="nav-list">
              <li className="nav-item">
                <Link to="/home" className="nav-link">
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link"
                  onClick={() => scrollToSection("features")}
                >
                  Features
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link"
                  onClick={() => scrollToSection("about")}
                >
                  About
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link"
                  onClick={() => scrollToSection("contact")}
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div className="nav-actions">
            {!islogged ? (
              <div className="auth-buttons">
                <Link to="/login" className="btn-login">
                  Login
                </Link>
                <Link to="/signup" className="btn-signup">
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="user-menu">
                <Link to="/profile" className="user-link">
                  <User className="user-icon" />
                  <span>{username}</span>
                </Link>
                <button onClick={handleLogout} className="logout-btn">
                  <LogOut className="logout-icon" />
                </button>
              </div>
            )}

            <button
              className="mobile-menu-btn"
              onClick={() => setSidebar(!showSidebar)}
            >
              {showSidebar ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {showSidebar && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            <ul className="mobile-nav-list">
              <li className="mobile-nav-item">
                <Link
                  to="/home"
                  className="mobile-nav-link"
                  onClick={() => setSidebar(false)}
                >
                  Dashboard
                </Link>
              </li>
              <li className="mobile-nav-item">
                <button
                  className="mobile-nav-link"
                  onClick={() => scrollToSection("features")}
                >
                  Features
                </button>
              </li>
              <li className="mobile-nav-item">
                <button
                  className="mobile-nav-link"
                  onClick={() => scrollToSection("about")}
                >
                  About
                </button>
              </li>
              <li className="mobile-nav-item">
                <button
                  className="mobile-nav-link"
                  onClick={() => scrollToSection("contact")}
                >
                  Contact
                </button>
              </li>
            </ul>

            <div className="mobile-auth">
              {!islogged ? (
                <div className="mobile-auth-buttons">
                  <Link
                    to="/login"
                    className="mobile-btn-login"
                    onClick={() => setSidebar(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="mobile-btn-signup"
                    onClick={() => setSidebar(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="mobile-user-menu">
                  <Link
                    to="/profile"
                    className="mobile-user-link"
                    onClick={() => setSidebar(false)}
                  >
                    <User className="user-icon" />
                    <span>{username}</span>
                  </Link>
                  <button onClick={handleLogout} className="mobile-logout-btn">
                    <LogOut className="logout-icon" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
