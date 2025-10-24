import "./Hero.css";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowRight, Play, Star, Users, Code, Zap } from "lucide-react";

const Hero = () => {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    { icon: <Code />, text: "4 Languages Supported" },
    { icon: <Zap />, text: "Real-Time Proctoring" },
    { icon: <Users />, text: "Plagiarism Detection" },
    { icon: <Star />, text: "AI-Powered Hints" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-container">
      <div className="hero-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            Master DSA with
            <span className="gradient-text"> AI-Powered Learning</span> &
            Proctoring
          </h1>

          <p className="hero-description">
            A comprehensive coding platform with multi-language support,
            real-time proctoring, AI assistance via Google Gemini, and
            plagiarism detection. Perfect for students and educational
            institutions.
          </p>

          <div className="hero-buttons">
            <Link to={"/home"} className="btn-primary">
              <span>Get Started</span>
              <ArrowRight className="btn-icon" />
            </Link>
            <button className="btn-secondary">
              <Play className="btn-icon" />
              <span>Watch Demo</span>
            </button>
          </div>

          <div className="trust-indicators">
            <p className="trust-text">Key Features</p>
            <div className="company-logos">
              <div className="logo-item">Monaco Editor</div>
              <div className="logo-item">Piston API</div>
              <div className="logo-item">Google Gemini</div>
              <div className="logo-item">Real-Time Tracking</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="code-window">
            <div className="window-header">
              <div className="window-controls">
                <div className="control red"></div>
                <div className="control yellow"></div>
                <div className="control green"></div>
              </div>
              <div className="window-title">logicode.py</div>
            </div>
            <div className="code-content">
              <div className="code-line">
                <span className="line-number">1</span>
                <span className="code-text">
                  <span className="keyword">def</span>{" "}
                  <span className="function">solve_problem</span>():
                </span>
              </div>
              <div className="code-line">
                <span className="line-number">2</span>
                <span className="code-text">
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="comment"># AI-powered code generation</span>
                </span>
              </div>
              <div className="code-line">
                <span className="line-number">3</span>
                <span className="code-text">
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="keyword">return</span>{" "}
                  <span className="string">"Success!"</span>
                </span>
              </div>
            </div>
          </div>

          <div className="floating-features">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`feature-bubble ${
                  index === currentFeature ? "active" : ""
                }`}
                style={{
                  "--delay": `${index * 0.5}s`,
                  "--x": `${20 + index * 20}%`,
                  "--y": `${30 + index * 15}%`,
                }}
              >
                <div className="bubble-icon">{feature.icon}</div>
                <span className="bubble-text">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
