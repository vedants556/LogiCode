import "./Testimonials.css";
import { useState } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

const Testimonials = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      company: "Google",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      rating: 4,
      text: "LogiCode transformed my coding journey completely. The AI-powered feedback helped me understand complex algorithms in ways I never thought possible. I landed my dream job at Google thanks to the comprehensive DSA preparation.",
    },
    {
      name: "Alex Rodriguez",
      role: "Full Stack Developer at Microsoft",
      company: "Microsoft",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "The instant code execution and AI assistance made learning so much more efficient. I went from beginner to confident developer in just 6 months. The community support is incredible!",
    },
    {
      name: "Priya Sharma",
      role: "Data Scientist at Amazon",
      company: "Amazon",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "As someone switching careers, LogiCode made the transition seamless. The personalized learning paths and real-time feedback helped me master programming concepts quickly. Highly recommended!",
    },
    {
      name: "David Kim",
      role: "Tech Lead at Meta",
      company: "Meta",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "The AI-powered code review feature is game-changing. It's like having a senior developer reviewing your code 24/7. My coding skills improved dramatically in just a few months.",
    },
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`star ${index < rating ? "filled" : ""}`}
        size={20}
      />
    ));
  };

  return (
    <section className="testimonials">
      <div className="containerr">
        <div className="testimonials-layout">
          <div className="testimonial-content">
            <div className="testimonial-card">
              <div className="quote-icon">
                <Quote size={40} />
              </div>

              <div className="testimonial-text">
                "{testimonials[currentTestimonial].text}"
              </div>

              <div className="testimonial-rating">
                {renderStars(testimonials[currentTestimonial].rating)}
              </div>

              <div className="testimonial-author">
                <div className="author-avatar">
                  <img
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].name}
                  />
                </div>
                <div className="author-info">
                  <div className="author-name">
                    {testimonials[currentTestimonial].name}
                  </div>
                  <div className="author-role">
                    {testimonials[currentTestimonial].role}
                  </div>
                  <div className="author-company">
                    {testimonials[currentTestimonial].company}
                  </div>
                </div>
              </div>
            </div>

            <div className="testimonial-navigation">
              <button
                className="nav-button prev"
                onClick={prevTestimonial}
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="testimonial-dots">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${
                      index === currentTestimonial ? "active" : ""
                    }`}
                    onClick={() => setCurrentTestimonial(index)}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <button
                className="nav-button next"
                onClick={nextTestimonial}
                aria-label="Next testimonial"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
