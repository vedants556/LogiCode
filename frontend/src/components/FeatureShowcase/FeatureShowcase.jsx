import "./FeatureShowcase.css";
import { useState } from "react";
import {
  Brain,
  Zap,
  Users,
  Target,
  Code,
  BookOpen,
  Trophy,
  CheckCircle,
} from "lucide-react";

const FeatureShowcase = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Code />,
      title: "Multi-Language Support",
      description:
        "Write code in C, C++, Python, or Java with Monaco Editor integration and real-time execution via Piston API.",
      benefits: [
        "4 Programming Languages",
        "Monaco Editor (VS Code)",
        "Syntax Highlighting",
        "Auto-completion Support",
      ],
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Brain />,
      title: "AI-Powered Assistance",
      description:
        "Get intelligent hints using Google Gemini AI without revealing solutions. Perfect for learning and problem-solving.",
      benefits: [
        "Google Gemini Integration",
        "Contextual Hints",
        "No Direct Solutions",
        "Learning-Focused Guidance",
      ],
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <Zap />,
      title: "Real-Time Proctoring",
      description:
        "Comprehensive monitoring system tracking tab switches, copy/paste activities, DevTools access, and session duration.",
      benefits: [
        "Tab Switch Detection",
        "Copy/Paste Monitoring",
        "DevTools Prevention",
        "Live Session Tracking",
      ],
      color: "from-red-500 to-orange-500",
    },
    {
      icon: <Target />,
      title: "Plagiarism Detection",
      description:
        "Advanced code similarity checking using Levenshtein algorithm with configurable thresholds and side-by-side comparison.",
      benefits: [
        "Levenshtein Algorithm",
        "85% Similarity Threshold",
        "Code Normalization",
        "Visual Comparison Tool",
      ],
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <Trophy />,
      title: "Teacher Dashboard",
      description:
        "God-level monitoring with real-time session tracking, event logs, student analytics, and comprehensive proctoring controls.",
      benefits: [
        "Active Session Monitoring",
        "Event Severity Levels",
        "Student Analytics",
        "Plagiarism Checker",
      ],
      color: "from-yellow-500 to-amber-500",
    },
    {
      icon: <BookOpen />,
      title: "LeetCode-Style Testing",
      description:
        "Run code with all test cases before submission. Timer-based auto-submit ensures fair competition and time management.",
      benefits: [
        "Run All Test Cases",
        "Submit Validation",
        "Timer Auto-Submit",
        "Performance Metrics",
      ],
      color: "from-indigo-500 to-blue-500",
    },
  ];

  return (
    <section className="feature-showcase" id="features">
      <div className="containerr">
        <div className="features-layout">
          <div className="features-content">
            <div className="features-header">
              <div className="section-badge">
                <span className="badge-icon">⚡</span>
                <span>Everything You Need</span>
              </div>
              <h2 className="section-title">
                Comprehensive Coding Platform with Advanced Proctoring
              </h2>
              <p className="section-description">
                LogiCode provides a complete solution for educational
                institutions with multi-language support, AI assistance,
                real-time monitoring, and plagiarism detection.
              </p>
            </div>

            <div className="features-cards">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`feature-card ${
                    activeFeature === index ? "active" : ""
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="feature-icon-container">
                    <div className="feature-icon">{feature.icon}</div>
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                  <ul className="feature-benefits">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="benefit-item">
                        <CheckCircle className="check-icon" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="features-visual">
            <div className="gradient-orb orb-1"></div>
            <div className="gradient-orb orb-2"></div>
            <div className="gradient-orb orb-3"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;
