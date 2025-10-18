import {
  Target,
  Lightbulb,
  Users,
  Settings,
  CodeXml,
  BookOpenCheck,
  Brain,
  Zap,
  Star,
} from "lucide-react";
import "./Objectives.css";
import { SiGooglegemini } from "react-icons/si";

const Objectives = () => {
  const objectives = [
    {
      icon: <Brain className="objective-icon" />,
      title: "AI-Guided Learning",
      description:
        "Empower your coding journey with our AI-driven features like 'Ask Doubts to AI' and 'Check Code Using AI,' designed to offer personalized, teacher-like support.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <Users className="objective-icon" />,
      title: "User Friendliness",
      description:
        "Start coding with no prior experience on any other platform. Write code however you want, we'll handle the rest!",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Zap className="objective-icon" />,
      title: "Fast & Efficient Execution",
      description:
        "Leverage the power of the Piston API, the fastest code execution engine, to run your code seamlessly and efficiently.",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: <BookOpenCheck className="objective-icon" />,
      title: "Career-Focused Learning",
      description:
        "Access a curated set of DSA questions and C programming exercises tailored to align with your academic curriculum, helping you excel in your studies and career.",
      color: "from-green-500 to-emerald-500",
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
          <h2 className="objectives-title">Empowering Your Coding Journey</h2>
          <p className="objectives-subtitle">
            Discover how our platform transforms the way you learn, practice,
            and master programming with cutting-edge AI technology.
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
