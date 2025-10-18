import "./Hero.css";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowRight, Play, Star, Users, Code, Zap } from "lucide-react";

const Hero = () => {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    { icon: <Code />, text: "AI-Powered Learning" },
    { icon: <Zap />, text: "Fast Execution" },
    { icon: <Users />, text: "Community Driven" },
    { icon: <Star />, text: "Career Focused" },
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
          <div className="hero-badge">
            <span className="badge-icon">🚀</span>
            <span>Smarter Code, Less Effort!</span>
          </div>

          <h1 className="hero-title">
            Supercharge Your
            <span className="gradient-text"> Programming Journey</span>
            with AI
          </h1>

          <p className="hero-description">
            Your AI pair programmer to write, debug, and refactor code faster
            with a fully integrated development experience. Master DSA, practice
            coding, and excel in your career.
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Students</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Languages</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">99%</span>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>

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
            <p className="trust-text">Trusted by developers at</p>
            <div className="company-logos">
              <div className="logo-item">Google</div>
              <div className="logo-item">Microsoft</div>
              <div className="logo-item">Amazon</div>
              <div className="logo-item">Meta</div>
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
