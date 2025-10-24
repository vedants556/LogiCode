import "./Testimonials.css";
import { useState } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

const Testimonials = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Student A",
      role: "Computer Science Student",
      company: "Engineering College",
      avatar:
        "https://ui-avatars.com/api/?name=Student+A&background=667eea&color=fff&size=150",
      rating: 5,
      text: "The multi-language support and Monaco Editor made practicing DSA problems so much easier. The AI hints helped me learn without just copying solutions. Great platform for students!",
    },
    {
      name: "Student B",
      role: "CS Undergraduate",
      company: "University",
      avatar:
        "https://ui-avatars.com/api/?name=Student+B&background=764ba2&color=fff&size=150",
      rating: 5,
      text: "I love the LeetCode-style interface with the Run and Submit buttons. Being able to test all test cases before submitting helped me understand my mistakes better.",
    },
    {
      name: "Teacher C",
      role: "Computer Science Faculty",
      company: "Educational Institution",
      avatar:
        "https://ui-avatars.com/api/?name=Teacher+C&background=f093fb&color=fff&size=150",
      rating: 5,
      text: "The teacher dashboard with proctoring features is exactly what we needed. Real-time monitoring, plagiarism detection, and detailed analytics make conducting assessments much more secure and manageable.",
    },
    {
      name: "Student D",
      role: "Programming Enthusiast",
      company: "Tech College",
      avatar:
        "https://ui-avatars.com/api/?name=Student+D&background=4facfe&color=fff&size=150",
      rating: 4,
      text: "The timer auto-submit feature keeps me focused during practice. The leaderboard is motivating, and I can track my progress as I solve more problems. Really helpful for competitive programming practice!",
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
