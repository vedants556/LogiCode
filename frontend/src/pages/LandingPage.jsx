import "./Landing.css";
import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Herosection/Hero";
import FeatureShowcase from "../components/FeatureShowcase/FeatureShowcase";
import Objectives from "../components/Objectives/Objectives";
import Testimonials from "../components/Testimonials/Testimonials";
import FAQ from "../components/FAQ/FAQ";
import Contact from "../components/Contactus/Contact";
import Footer from "../components/Footer/Footer";
import { useState, useEffect } from "react";

function LandingPage() {
  return (
    <>
      <div className="fade-in">
        <Navbar />
      </div>
      <div className="fade-in">
        <Hero />
      </div>
      <div className="fade-in" id="features">
        <FeatureShowcase />
      </div>
      <div className="fade-in" id="about">
        <Objectives />
      </div>
      <div className="fade-in">
        <Testimonials />
      </div>
      <div className="fade-in">
        <FAQ />
      </div>
      <div className="fade-in" id="contact">
        <Contact />
      </div>
      <div className="fade-in">
        <Footer />
      </div>
    </>
  );
}

export default LandingPage;
