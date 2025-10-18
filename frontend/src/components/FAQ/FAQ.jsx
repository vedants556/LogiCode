import "./FAQ.css";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "How does the AI-powered learning work?",
      answer:
        "The AI analyzes your coding patterns, identifies knowledge gaps, and creates personalized learning paths. It provides real-time feedback, suggests improvements, and adapts difficulty based on your progress. The system learns from your interactions to provide increasingly relevant assistance.",
    },
    {
      question: "What programming languages are supported?",
      answer:
        "We support 50+ programming languages including Python, Java, C++, JavaScript, Go, Rust, and many more. Our execution engine can run code in real-time with sub-second response times, making it perfect for learning and practice.",
    },
    {
      question: "Is there a community aspect to the platform?",
      answer:
        "Yes! You can share solutions, get code reviews from peers, participate in discussions, and learn from other developers. Our community features include solution sharing, peer mentoring, and collaborative problem-solving sessions.",
    },
    {
      question: "How does the career-focused learning help?",
      answer:
        "Our curriculum is designed with industry requirements in mind. We offer interview preparation, DSA mastery paths, system design courses, and real-world project scenarios. Many of our users have successfully landed jobs at top tech companies.",
    },
    {
      question: "What's the pricing structure?",
      answer:
        "We offer a free tier with basic features and limited AI assistance. Our premium plans include unlimited AI interactions, advanced analytics, priority support, and access to exclusive content. We also have student discounts and team plans for organizations.",
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
                Got Questions? We've Got the Answers.
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
