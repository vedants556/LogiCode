import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <h2>logicode</h2>
        </div>
        <div className="footer-links">
          <ul className="navul">
            <li className="navli">
              <a href="#Navbar">Home</a>
            </li>
            <li className="navli">
              <a href="#obj">About</a>
            </li>
            <li className="navli">
              <a href="#name">Contact</a>
            </li>
          </ul>
        </div>
        <div className="footer-social">
          <a href="https://facebook.com" aria-label="Facebook">
            <Facebook className="social-icon" />
          </a>
          <a href="https://twitter.com" aria-label="Twitter">
            <Twitter className="social-icon" />
          </a>
          <a href="https://instagram.com" aria-label="Instagram">
            <Instagram className="social-icon" />
          </a>
          <a href="https://linkedin.com" aria-label="LinkedIn">
            <Linkedin className="social-icon" />
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 logicode. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
