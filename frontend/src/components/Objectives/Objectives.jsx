import {
  Target,
  Lightbulb,
  Users,
  Settings,
  Code2,
  BookOpenCheck,
  Brain,
  Zap,
  Star,
  Shield,
  Trophy,
} from "lucide-react";
import "./Objectives.css";
import { SiGooglegemini } from "react-icons/si";

const Objectives = () => {
  const objectives = [
    {
      icon: <Brain className="objective-icon" />,
      title: "AI-Powered Hints",
      description:
        "Get intelligent, contextual hints via Google Gemini when stuck on problems. Our AI provides guidance without revealing direct solutions, fostering genuine learning.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <Code2 className="objective-icon" />,
      title: "Professional Code Editor",
      description:
        "Write code using Monaco Editor with syntax highlighting, auto-completion, and support for C, C++, Python, and Java.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Zap className="objective-icon" />,
      title: "Secure Code Execution",
      description:
        "Powered by Piston API for sandboxed, secure code execution. Run and test your code with real-time feedback and performance metrics.",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: <Users className="objective-icon" />,
      title: "Teacher Dashboard",
      description:
        "Comprehensive monitoring tools with real-time session tracking, proctoring event logs, plagiarism detection, and detailed student analytics.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <Shield className="objective-icon" />,
      title: "Advanced Security",
      description:
        "Built-in security with rate limiting, request validation, event batching, and suspicious activity detection to prevent system abuse.",
      color: "from-red-500 to-orange-500",
    },
    {
      icon: <Trophy className="objective-icon" />,
      title: "Competitive Leaderboard",
      description:
        "Modern leaderboard with podium display, rankings by problems solved, and progress tracking. Compete with peers and track achievements.",
      color: "from-indigo-500 to-purple-500",
    },
  ];

  return (
    <section className="objectives-section" id="about">
      <div className="objectives-container">
        <div className="objectives-header">
          <div className="section-badge">
            <Star className="badge-icon" />
            <span>Our Objectives</span>
          </div>
          <h2 className="objectives-title">
            Built for Students & Educational Institutions
          </h2>
          <p className="objectives-subtitle">
            LogiCode combines powerful coding tools with comprehensive
            proctoring features, making it perfect for learning DSA, conducting
            assessments, and maintaining academic integrity.
          </p>
        </div>

        <div className="objectives-grid">
          {objectives.map((objective, index) => (
            <div key={index} className="objective-card">
              <div className="objective-icon-container">{objective.icon}</div>
              <h3 className="objective-heading">{objective.title}</h3>
              <p className="objective-description">{objective.description}</p>
              <div className="objective-accent"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Objectives;
