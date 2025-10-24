import { useState } from "react";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  Mail,
  ArrowRight,
  Code,
  Users,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import "./Footer.css";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log("Newsletter subscription:", email);
    setEmail("");
  };

  const footerLinks = {
    platform: [
      { name: "Features", href: "#features" },
      { name: "Problems", href: "/home" },
      { name: "Leaderboard", href: "/leaderboard" },
      { name: "Teacher Dashboard", href: "/teacher-dashboard" },
    ],
    features: [
      { name: "Multi-Language Support", href: "#features" },
      { name: "AI Assistance", href: "#features" },
      { name: "Proctoring System", href: "#features" },
      { name: "Plagiarism Detection", href: "#features" },
    ],
    resources: [
      {
        name: "GitHub Repository",
        href: "https://github.com/vedants556/logicode",
      },
      { name: "Documentation", href: "#about" },
      { name: "FAQ", href: "#faq" },
      { name: "Contact", href: "#contact" },
    ],
    technologies: [
      { name: "Monaco Editor", href: "#" },
      { name: "Piston API", href: "#" },
      { name: "Google Gemini", href: "#" },
      { name: "React & Node.js", href: "#" },
    ],
  };

  return (
    <footer className="footer">
      <div className="footer-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <div className="containerr">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">
              <Code className="logo-icon" />
              <span className="logo-text">logicode</span>
            </div>
            <p className="footer-description">
              A comprehensive coding platform with multi-language support,
              real-time proctoring, and AI assistance for students and
              educational institutions.
            </p>
            <div className="footer-social">
              <a
                href="https://github.com/vedants556/logicode"
                aria-label="GitHub"
                className="social-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="social-icon" />
              </a>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-column">
              <h4 className="column-title">Platform</h4>
              <ul className="column-links">
                {footerLinks.platform.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="footer-link">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="column-title">Features</h4>
              <ul className="column-links">
                {footerLinks.features.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="footer-link">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="column-title">Resources</h4>
              <ul className="column-links">
                {footerLinks.resources.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="footer-link">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="column-title">Technologies</h4>
              <ul className="column-links">
                {footerLinks.technologies.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="footer-link">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="footer-newsletter">
            <div className="newsletter-content">
              <h4 className="newsletter-title">Stay Updated</h4>
              <p className="newsletter-description">
                Get the latest updates on new features and platform
                improvements.
              </p>
              <form
                onSubmit={handleNewsletterSubmit}
                className="newsletter-form"
              >
                <div className="input-group">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="newsletter-input"
                    required
                  />
                  <button type="submit" className="newsletter-button">
                    <ArrowRight className="button-icon" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="footer-stats">
          <div className="stat-item">
            <Code className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">4</span>
              <span className="stat-label">Languages</span>
            </div>
          </div>
          <div className="stat-item">
            <Users className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">3</span>
              <span className="stat-label">User Roles</span>
            </div>
          </div>
          <div className="stat-item">
            <BookOpen className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Monitoring</span>
            </div>
          </div>
          <div className="stat-item">
            <HelpCircle className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">AI</span>
              <span className="stat-label">Google Gemini</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © 2025 LogiCode. Built for students and educational institutions.
            </p>
            <div className="footer-bottom-links">
              <a href="#privacy" className="bottom-link">
                Privacy
              </a>
              <a href="#terms" className="bottom-link">
                Terms
              </a>
              <a href="#cookies" className="bottom-link">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
