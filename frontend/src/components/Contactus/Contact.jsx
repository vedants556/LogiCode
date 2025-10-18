import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import "./Contact.css";
import { Mail, Send, MessageCircle, Phone, MapPin } from "lucide-react";

const Contact = () => {
  const form = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const sendEmail = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    emailjs
      .sendForm("service_pg2yl4l", "YOUR_TEMPLATE_ID", form.current, {
        publicKey: "YOUR_PUBLIC_KEY",
      })
      .then(
        () => {
          console.log("SUCCESS!");
          setSubmitStatus("success");
          form.current.reset();
        },
        (error) => {
          console.log("FAILED...", error.text);
          setSubmitStatus("error");
        }
      )
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const contactInfo = [
    {
      icon: <Mail className="contact-icon" />,
      title: "Email Us",
      description: "Get in touch via email",
      value: "hello@logicode.com",
    },
    {
      icon: <Phone className="contact-icon" />,
      title: "Call Us",
      description: "Speak with our team",
      value: "+1 (555) 123-4567",
    },
    {
      icon: <MapPin className="contact-icon" />,
      title: "Visit Us",
      description: "Come say hello",
      value: "San Francisco, CA",
    },
  ];

  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        <div className="contact-header">
          <div className="section-badge">
            <MessageCircle className="badge-icon" />
            <span>Contact Us</span>
          </div>
          <h2 className="contact-title">Get in Touch with Us</h2>
          <p className="contact-subtitle">
            We're excited to hear from you! Whether you have questions,
            feedback, or just want to connect, drop us a message and let's
            create something amazing together.
          </p>
        </div>

        <div className="contact-content">
          <div className="contact-info">
            <div className="contact-info-header">
              <h3 className="info-title">Let's Start a Conversation</h3>
              <p className="info-description">
                Ready to transform your coding journey? We're here to help you
                every step of the way.
              </p>
            </div>

            <div className="contact-methods">
              {contactInfo.map((info, index) => (
                <div key={index} className="contact-method">
                  <div className="method-icon">{info.icon}</div>
                  <div className="method-content">
                    <h4 className="method-title">{info.title}</h4>
                    <p className="method-description">{info.description}</p>
                    <span className="method-value">{info.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="contact-form-container">
            <div className="contact-form">
              <form ref={form} onSubmit={sendEmail}>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="to_name"
                    placeholder="Your Name"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="user_email"
                    placeholder="Your Email"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Your Message"
                    rows="5"
                    className="form-textarea"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className={`submit-button ${
                    isSubmitting ? "submitting" : ""
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="button-icon" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>

                {submitStatus === "success" && (
                  <div className="status-message success">
                    <MessageCircle className="status-icon" />
                    <span>
                      Message sent successfully! We'll get back to you soon.
                    </span>
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="status-message error">
                    <span>Failed to send message. Please try again.</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
