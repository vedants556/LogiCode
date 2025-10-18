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
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const FeatureShowcase = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Users />,
      title: "Community Driven",
      description:
        "Learn from peers, share solutions, and grow together in our vibrant coding community.",
      benefits: [
        "Peer learning",
        "Solution sharing",
        "Code reviews",
        "Mentorship programs",
      ],
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Target />,
      title: "Career Focused",
      description:
        "Master DSA and system design with industry-relevant problems and interview preparation.",
      benefits: [
        "Interview prep",
        "DSA mastery",
        "System design",
        "Industry insights",
      ],
      color: "from-green-500 to-emerald-500",
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
              <h2 className="section-title">Code Smarter, Ship Faster!</h2>
              <p className="section-description">
                Our platform is built to supercharge every step of your
                development workflow with cutting-edge AI technology.
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
                  <div className="feature-cta">
                    <span>Learn More</span>
                    <ArrowRight className="arrow-icon" />
                  </div>
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
