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
      { name: "Pricing", href: "#pricing" },
      { name: "API", href: "#api" },
      { name: "Documentation", href: "#docs" },
    ],
    developers: [
      { name: "Community", href: "#community" },
      { name: "Blog", href: "#blog" },
      { name: "Tutorials", href: "#tutorials" },
      { name: "Support", href: "#support" },
    ],
    resources: [
      { name: "Privacy Policy", href: "#privacy" },
      { name: "Terms of Service", href: "#terms" },
      { name: "Security", href: "#security" },
      { name: "Status", href: "#status" },
    ],
    company: [
      { name: "About Us", href: "#about" },
      { name: "Careers", href: "#careers" },
      { name: "Press", href: "#press" },
      { name: "Contact", href: "#contact" },
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
              Empowering developers with AI-powered coding assistance. Master
              programming, excel in your career, and build the future.
            </p>
            <div className="footer-social">
              <a
                href="https://github.com"
                aria-label="GitHub"
                className="social-link"
              >
                <Github className="social-icon" />
              </a>
              <a
                href="https://twitter.com"
                aria-label="Twitter"
                className="social-link"
              >
                <Twitter className="social-icon" />
              </a>
              <a
                href="https://linkedin.com"
                aria-label="LinkedIn"
                className="social-link"
              >
                <Linkedin className="social-icon" />
              </a>
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                className="social-link"
              >
                <Instagram className="social-icon" />
              </a>
              <a
                href="https://facebook.com"
                aria-label="Facebook"
                className="social-link"
              >
                <Facebook className="social-icon" />
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
              <h4 className="column-title">Developers</h4>
              <ul className="column-links">
                {footerLinks.developers.map((link, index) => (
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
              <h4 className="column-title">Company</h4>
              <ul className="column-links">
                {footerLinks.company.map((link, index) => (
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
              <h4 className="newsletter-title">Stay in the loop</h4>
              <p className="newsletter-description">
                Get the latest updates on new features, tutorials, and coding
                tips.
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
            <Users className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Active Users</span>
            </div>
          </div>
          <div className="stat-item">
            <Code className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">50+</span>
              <span className="stat-label">Languages</span>
            </div>
          </div>
          <div className="stat-item">
            <BookOpen className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">1000+</span>
              <span className="stat-label">Problems</span>
            </div>
          </div>
          <div className="stat-item">
            <HelpCircle className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">24/7</span>
              <span className="stat-label">AI Support</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © 2025 LogiCode. Built by developers for developers.
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
