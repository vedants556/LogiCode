import "./FAQ.css";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "What programming languages does LogiCode support?",
      answer:
        "LogiCode currently supports 4 programming languages: C, C++, Python, and Java. Each language has full support with syntax highlighting, auto-completion via Monaco Editor, and secure code execution through the Piston API.",
    },
    {
      question: "How does the AI assistance work?",
      answer:
        "LogiCode integrates Google Gemini AI to provide intelligent hints when you're stuck on a problem. The AI analyzes your problem and code to give contextual guidance without revealing direct solutions, helping you learn and develop problem-solving skills.",
    },
    {
      question: "What is the proctoring system?",
      answer:
        "Our proctoring system monitors student activity during coding sessions, including tab switches, copy/paste operations, and DevTools access attempts. Teachers can view real-time sessions, check event logs with severity levels, and use plagiarism detection to ensure academic integrity.",
    },
    {
      question: "How does plagiarism detection work?",
      answer:
        "LogiCode uses the Levenshtein distance algorithm to compare code submissions between students. Code is normalized (removing whitespace and comments) before comparison. The system flags submissions with more than 85% similarity, and teachers can view side-by-side comparisons.",
    },
    {
      question: "What features are available for teachers?",
      answer:
        "Teachers get access to a comprehensive dashboard with real-time session monitoring, proctoring event logs (categorized by severity: low, medium, high), student analytics, plagiarism checker, and detailed activity reports for each student.",
    },
    {
      question: "What is the timer auto-submit feature?",
      answer:
        "For timed problems, LogiCode automatically submits your code when the timer reaches zero. You'll get a warning at 1 minute remaining, and then a 3-second notification before automatic submission. This ensures fair competition and time management.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="faq">
      <div className="containerr">
        <div className="faq-layout">
          <div className="faq-content">
            <div className="faq-header">
              <div className="section-badge">
                <HelpCircle className="badge-icon" size={20} />
                <span>FAQ</span>
              </div>
              <h2 className="section-title">Frequently Asked Questions</h2>
              <p className="section-description">
                Everything you need to know about LogiCode's features and
                capabilities.
              </p>
            </div>

            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`faq-item ${openIndex === index ? "active" : ""}`}
                >
                  <button
                    className="faq-question"
                    onClick={() => toggleFAQ(index)}
                    aria-expanded={openIndex === index}
                  >
                    <span className="question-text">{faq.question}</span>
                    <ChevronDown
                      className={`chevron ${
                        openIndex === index ? "rotated" : ""
                      }`}
                      size={24}
                    />
                  </button>

                  <div
                    className={`faq-answer ${
                      openIndex === index ? "open" : ""
                    }`}
                  >
                    <div className="answer-content">{faq.answer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
