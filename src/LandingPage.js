
import React, { useState, useEffect, useMemo } from "react";
import { ArrowRight } from "react-feather";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

const SlideshowWithTopBar = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  const slidesData = useMemo(() => [
    {
      id: 1,
      // heroHeading: "Your Car. Yours Personally",
      media: { src: "/slider.png", alt: "Custom Headrest" },
      accentColor: "#94701f"
    },
    // {
    //   id: 2,
    //   heroHeading: "Your Car. Your Signature",
    //   media: { src: "/models/mahindra-2.png", alt: "Luxury Materials" },
    //   accentColor: "#8B4513"
    // },
    // {
    //   id: 3,
    //   heroHeading: "Your Car. Your Way",
    //   media: { src: "/models/mahindra-3.png", alt: "Custom Fit" },
    //   accentColor: "#8B4513"
    // }
  ], []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(prev => (prev + 1) % slidesData.length);
        setIsAnimating(false);
      }, 1200); // image animation duration
    }, 7000);
    return () => clearInterval(timer);
  }, [slidesData.length]);

  return (
    <div className="slideshow-container">
      <div className="slide-topbar">
        {/* <img src="/logo-rec - Copy.png" alt="Logo" className="slide-logo-top" / */}
        <div className="center-heading">
          {/* <h1>Your's Personally</h1> */}
        </div>
      </div>
      
      {slidesData.map((slide, index) => (
        <div
          key={slide.id}
          className={`slide ${index === currentSlide ? "active" : ""}`}
          style={{ backgroundImage: `url(${slide.media.src})` }}
          aria-hidden={index !== currentSlide}
        >
          <div className="slide-overlay"></div>
          <div className={`text-overlay-box ${index === currentSlide ? "text-active" : ""}`}>
            <h2 className="slide-heading hero-heading">{slide.heroHeading}</h2>
          </div>
        </div>
      ))}
      
      {/* Static button outside the slider */}
      <button
        className="slide-cta-button static-cta-button"
        onClick={() => navigate("/personalise")}
        style={{ 
          backgroundColor: slidesData[currentSlide].accentColor, 
          fontFamily: "'AdornS Condensed Sans', sans-serif" 
        }}
      >
        <span>GO PERSONALISE</span>
        <ArrowRight size={20} />
      </button>
    </div>
  );
};

export default SlideshowWithTopBar;