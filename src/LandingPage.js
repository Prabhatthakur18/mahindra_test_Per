// import React, { useState, useEffect } from 'react';
// import './Landing.css';
// import { useNavigate } from 'react-router-dom';
// import { Sparkles, CheckCircle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

// const slidesData = [
//   {
//     id: 1,
//     title: "Transform Your Drive",
//     // heroHeading: "TRANSFORM YOUR SUV THE WAY YOU LIKE!",
//     content: [
//       "Elevate your journey with custom Accessories tailored to your style. Premium stitching, personalized initials — crafted for comfort and elegance.",
//       "Whether you're heading to the office or on a weekend getaway, our accessories provide unmatched luxury, ergonomic support, and a personal touch that sets your SUV interior apart.",
//       "Every Accessory is made with Automotive Grade materials, precision-finished by skilled Manpower to ensure long-lasting quality."
//     ],
//     tags: ["Premium Comfort", "Custom Embroidery", "Luxury Finish"],
//     media: {
//       type: 'image',
//       src: "/models/thar.png",
//       alt: "Custom Headrest"
//     },
//     layout: 'text-left',
//     showCTA: true
//   },
//   {
//     id: 2,
//     title: "Craftsmanship You Can Feel",
//     // heroHeading: "PRECISION IN EVERY STITCH",
//     content: [
//       "From raw materials to finished luxury — our accessories go through expert detailing and precision cuts to meet the highest standards.",
//       "Each product is shaped by skilled hands, ensuring perfection in every stitch and seam. We don't just build accessories — we sculpt experiences meant to last.",
//       "What you get isn't just a product — it's a masterpiece made to elevate your drive, every single day."
//     ],
//     tags: ["Premium Embroidery", "Attention to Detail", "Luxury in Every Thread"],
//     media: {
//       type: 'video',
//       src: "/models/WhatsApp Video 2025-06-30 at 18.56.02_d3df19a1.mp4"
//     },
//     layout: 'text-left',
//     showCTA: true
//   }
// ];

// export default function LandingPage() {
//   const navigate = useNavigate();
//   const [currentSlide, setCurrentSlide] = useState(0);
//   const [isAnimating, setIsAnimating] = useState(false);
//   const [isHovered, setIsHovered] = useState(false);

//   const nextSlide = () => {
//     if (isAnimating) return;
//     setIsAnimating(true);
//     setCurrentSlide((prev) => (prev + 1) % slidesData.length);
//   };

//   const prevSlide = () => {
//     if (isAnimating) return;
//     setIsAnimating(true);
//     setCurrentSlide((prev) => (prev - 1 + slidesData.length) % slidesData.length);
//   };

//   useEffect(() => {
//     const timer = setTimeout(() => setIsAnimating(false), 800);
//     return () => clearTimeout(timer);
//   }, [currentSlide]);

//   // Auto-slide every 4s unless hovered
//   useEffect(() => {
//     if (isHovered) return;

//     const interval = setInterval(() => {
//       setCurrentSlide((prev) => (prev + 1) % slidesData.length);
//     }, 4000);

//     return () => clearInterval(interval);
//   }, [isHovered]);

//   const currentSlideData = slidesData[currentSlide];

//   return (
//     <div className="landing-page">
//       <div className="carousel-container">

//         {/* === Top Bar with Logo + Hero Heading === */}
//         <div className="slide-topbar">
//           <img src="/Mahindra Twin Peaks Logo JPG.png" alt="Logo" className="slide-logo-top" />
//           <h1 className="slide-hero-top-heading">{currentSlideData.heroHeading}</h1>
//         </div>

//         <div className="slide-wrapper">
//           {/* === Media Content === */}
//           <div className={`media-section ${currentSlideData.layout === 'text-left' ? 'media-right' : 'media-left'}`}>
//             {currentSlideData.media.type === 'image' ? (
//               <img
//                 src={currentSlideData.media.src}
//                 alt={currentSlideData.media.alt}
//                 className="fullscreen-media"
//                 key={`img-${currentSlide}`}
//               />
//             ) : (
//               <video
//                 src={currentSlideData.media.src}
//                 className="fullscreen-media"
//                 autoPlay
//                 loop
//                 muted
//                 playsInline
//                 key={`video-${currentSlide}`}
//               />
//             )}
//           </div>

//           {/* === Text Overlay === */}
//           <div className={`text-overlay ${currentSlideData.layout}`}>
//             <div className="text-content-inner">
//               <h2 className="slide-title">
//                 <Sparkles size={30} className="title-icon" />
//                 <span className="typewriter-text" key={`title-${currentSlide}`}>
//                   {currentSlideData.title}
//                 </span>
//               </h2>

//               <div className="slide-content">
//                 {currentSlideData.content.map((paragraph, index) => (
//                   <p
//                     key={`p-${currentSlide}-${index}`}
//                     className="typewriter-paragraph"
//                     style={{ animationDelay: `${0.5 + index * 0.3}s`, textAlign: 'justify' }}
//                   >
//                     {paragraph}
//                   </p>
//                 ))}
//               </div>

//               {/* === Tags (Pause on Hover) === */}
//               <div
//                 className="slide-tags"
//                 key={`tags-${currentSlide}`}
//                 onMouseEnter={() => setIsHovered(true)}
//                 onMouseLeave={() => setIsHovered(false)}
//               >
//                 {currentSlideData.tags.map((tag, index) => (
//                   <span
//                     key={tag}
//                     className="tag-item"
//                     style={{ animationDelay: `${1.5 + index * 0.1}s` }}
//                   >
//                     <CheckCircle size={14} />
//                     {tag}
//                   </span>
//                 ))}
//               </div>

//               {/* === CTA Button (Pause on Hover) === */}
//               {currentSlideData.showCTA && (
//                 <div
//                   className="slide-cta-container"
//                   key={`cta-${currentSlide}`}
//                   onMouseEnter={() => setIsHovered(true)}
//                   onMouseLeave={() => setIsHovered(false)}
//                 >
//                   <button
//                     className="slide-cta-button"
//                     onClick={() => navigate('/personalise')}
//                   >
//                     GO PERSONALISE <ArrowRight size={16} className="slide-cta-arrow" />
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* === Navigation Arrows === */}
//         <div className="carousel-navigation">
//           <button
//             className="nav-arrow nav-prev"
//             onClick={prevSlide}
//             disabled={isAnimating}
//             aria-label="Previous Slide"
//           >
//             <ChevronLeft />
//           </button>
//           <button
//             className="nav-arrow nav-next"
//             onClick={nextSlide}
//             disabled={isAnimating}
//             aria-label="Next Slide"
//           >
//             <ChevronRight />
//           </button>
//         </div>

//       </div>
//     </div>
//   );
// }
// import React, { useState, useEffect, useMemo } from 'react';
// import { ArrowRight } from 'react-feather';
// import { useNavigate } from 'react-router-dom';
// import "./Landing.css"

// const SlideshowWithTopBar = () => {
//   const [currentSlide, setCurrentSlide] = useState(0);
//   const [prevSlide, setPrevSlide] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [imagesLoaded, setImagesLoaded] = useState(0);
//   const [isScrolled, setIsScrolled] = useState(false);
//   const navigate = useNavigate();

//   const slidesData = useMemo(() => [
//     {
//       id: 1,
//       title: "Transform Your Drive",
//       heroHeading: "Crafted for Comfort. Styled by You.",
//       topBarHeading: "PREMIUM SUV ACCESSORIES",
//       // content: [
//         // "Elevate your journey with custom Accessories tailored to your style. Premium stitching, personalized initials — crafted for comfort and elegance.",
//         // "Whether you're heading to the office or on a weekend getaway, our accessories provide unmatched luxury, ergonomic support, and a personal touch that sets your SUV interior apart.",
//         // "Every Accessory is made with Automotive Grade materials, precision-finished by skilled Manpower to ensure long-lasting quality."
//         content: ["Personalized accessories, precision craftsmanship, and interiors that reflect your taste — transforming every drive into an indulgence. "],
//       tags: ["Premium Comfort", "Custom Embroidery", "Luxury Finish"],
//       media: {
//         type: 'image',
//         src: "/models/mahindra-1.png",
//         alt: "Custom Headrest"
//       },
//       layout: 'text-left',
//       showCTA: true,
//       accentColor: "#8B4513",
//       transition: 'slideFromRight'
//     },
//     {
//       id: 2,
//       title: "Premium Materials",
//       heroHeading: "Your Car. Your Signature.",
//       topBarHeading: "PREMIUM MATERIALS & CRAFTSMANSHIP",
//       content: [
//         "Personalised accessories that blend innovation, luxury, and comfort — making every drive uniquely yours ."
//       ],
//       tags: ["Premium Leather", "Handcrafted", "Eco-Friendly"],
//       media: {
//         type: 'image',
//         src: "/models/mahindra-2.png",
//         alt: "Luxury Materials"
//       },
//       layout: 'text-left',
//       showCTA: true,
//       accentColor: "#8B4513",
//       transition: 'slideFromTop'
//     },
//     {
//       id: 3,
//       title: "Custom Fit",
//       heroHeading: "Your car is more than a drive",
//       topBarHeading: "CUSTOM FIT FOR YOUR SUV",
//       content: [
//         " it’s your personal space. You can style, customise, and craft every detail to suit your unique lifestyle. Precision, comfort, and individuality — all, Personally Yours!!"
//       ],
//       tags: ["Perfect Fit", "Easy Installation", "Vehicle Specific"],
//       media: {
//         type: 'image',
//         src: "/models/mahindra-3.png",
//         alt: "Custom Fit"
//       },
//       layout: 'text-left',
//       showCTA: true,
//       accentColor: "#8B4513",
//       transition: 'zoomIn'
//     },
//     // {
//     //   id: 4,
//     //   title: "Exclusive Designs",
//     //   heroHeading: "UNIQUE DESIGNS FOR THE DISCRIMINATING DRIVER",
//     //   topBarHeading: "EXCLUSIVE DESIGNS",
//     //   content: [
//     //     "Discover our exclusive collection of designs that can't be found anywhere else.",
//     //     "From classic elegance to modern sophistication, find the perfect style for your vehicle.",
//     //     "Limited edition patterns ensure your SUV stands out from the crowd."
//     //   ],
//     //   tags: ["Exclusive Patterns", "Limited Edition", "Stand Out"],
//     //   media: {
//     //     type: 'image',
//     //     src: "/models/mahindra-4.png",
//     //     alt: "Exclusive Designs"
//     //   },
//     //   layout: 'text-left',
//     //   showCTA: true,
//     //   accentColor: "#8B4513",
//     //   transition: 'fadeIn'
//     // }
//   ], []);

//   // Handle scroll event for top bar
//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 50);
//     };
    
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   // Preload images
//   useEffect(() => {
//     const imageUrls = slidesData.map(slide => slide.media.src);
//     let loadedCount = 0;
    
//     const checkAllLoaded = () => {
//       if (loadedCount === imageUrls.length) {
//         setLoading(false);
//       }
//     };
    
//     imageUrls.forEach(url => {
//       const img = new Image();
//       img.onload = () => {
//         loadedCount++;
//         setImagesLoaded(loadedCount);
//         checkAllLoaded();
//       };
//       img.onerror = () => {
//         loadedCount++;
//         setImagesLoaded(loadedCount);
//         checkAllLoaded();
//       };
//       img.src = url;
//     });
//   }, [slidesData]);

//   // Auto-advance slides
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setPrevSlide(currentSlide);
//       setCurrentSlide((prev) => (prev + 1) % slidesData.length);
//     }, 3000);
    
//     return () => clearInterval(timer);
//   }, [currentSlide, slidesData.length]);

//   const goToSlide = (index) => {
//     setPrevSlide(currentSlide);
//     setCurrentSlide(index);
//   };

//   const goToNextSlide = () => {
//     setPrevSlide(currentSlide);
//     setCurrentSlide((prev) => (prev + 1) % slidesData.length);
//   };

//   const goToPrevSlide = () => {
//     setPrevSlide(currentSlide);
//     setCurrentSlide((prev) => (prev - 1 + slidesData.length) % slidesData.length);
//   };

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>Loading... ({imagesLoaded}/{slidesData.length})</p>
//       </div>
//     );
//   }

//   return (
//     <div className="slideshow-container">
//       {/* Top Bar */}
//       <div className={`slide-topbar ${isScrolled ? 'scrolled' : ''}`}>
//         <div className="topbar-content">
//           <img src="/logo-rec.png" alt="Logo" className="slide-logo-top" />
//           <h1 className="slide-hero-top-heading">Your Personally</h1>
//           <div className="topbar-spacer"></div>
//         </div>
//       </div>

//       {/* Slides */}
//       {slidesData.map((slide, index) => (
//         <div
//           key={slide.id}
//           className={`slide ${index === currentSlide ? 'active' : ''} ${index === prevSlide ? 'previous' : ''} ${slide.transition}`}
//           aria-hidden={index !== currentSlide}
//         >
//           <div 
//             className="slide-background"
//             style={{ 
//               backgroundImage: `url(${slide.media.src})`
//             }}
//             role="img"
//             aria-label={slide.media.alt}
//           ></div>
          
//           <div className="slide-overlay"></div>
          
//           <div className="slide-content">
//             {/* <div className="heading-container">
//               <h2 className="slide-heading">{slide.heroHeading}</h2>
//                 <div className="w-2/3 text-gray-600">
//     <p>
//       {slide.content.map((text, idx) => (
//         <span key={idx} className="slide-text">{text}</span>
//       ))}
//     </p>
//   </div>
//             </div> */}
// {/*             
//             <div className="heading-container">
//   <h2 className="slide-heading">{slide.heroHeading}</h2>
//   <div className="w-2/3 text-gray-600">
//     <p>
//       {slide.content.map((text, idx) => (
//         <span key={idx} className="slide-text">{text}</span>
//       ))}
//     </p>
//   </div>
// </div> */}
// <div className="heading-container">
//   {/* <h2 className="slide-heading">{slide.heroHeading}</h2>
//   <p>
//     {slide.content.map((text, idx) => (
//       <span key={idx} className="slide-text">{text}</span>
//     ))}
//   </p> */}
//   <div className="text-overlay-box">
//     <h2 className="slide-heading">{slide.heroHeading}</h2>
//     <p>
//       {slide.content.map((text, idx) => (
//         <span key={idx} className="slide-text">{text}</span>
//       ))}
//     </p>
//   </div>
// </div>
//             {slide.showCTA && (
//               <div className="slide-cta-container">
//                 <button
//                   className="slide-cta-button"
//                   onClick={() => navigate('/personalise')}
//                   style={{ backgroundColor: slide.accentColor }}
//                   aria-label="Go to personalization page"
//                 >
//                   <span>GO PERSONALISE</span>
//                   <ArrowRight size={20} className="slide-cta-arrow" />
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       ))}
      
//     </div>
//   );
// };

// export default SlideshowWithTopBar;
// import React, { useState, useEffect, useMemo } from "react";
// import { ArrowRight } from "react-feather";
// import { useNavigate } from "react-router-dom";
// import "./Landing.css";

// const SlideshowWithTopBar = () => {
//   const [currentSlide, setCurrentSlide] = useState(0);
//   const [isAnimating, setIsAnimating] = useState(false);
//   const navigate = useNavigate();

//   const slidesData = useMemo(
//     () => [
//       {
//         id: 1,
//         heroHeading: "Crafted for Comfort. Styled by You.",
//         content: [
//           "Personalized accessories, precision craftsmanship, and interiors that reflect your taste — transforming every drive into an indulgence."
//         ],
//         media: {
//           src: "/models/mahindra-1.png",
//           alt: "Custom Headrest"
//         },
//         accentColor: "#8B4513",
//         direction: "top" // NEW

//       },
//       {
//         id: 2,
//         heroHeading: "Your Car. Your Signature.",
//         content: [
//           "Personalised accessories that blend innovation, luxury, and comfort — making every drive uniquely yours."
//         ],
//         media: {
//           src: "/models/mahindra-2.png",
//           alt: "Luxury Materials"
//         },
//               direction: "left", // NEW

//         accentColor: "#8B4513"
//       },
//       {
//         id: 3,
//         heroHeading: "Your's car is more than a drive",
//         content: [
//           "It’s your personal space. You can style, customise, and craft every detail to suit your unique lifestyle."
//         ],
//         media: {
//           src: "/models/mahindra-3.png",
//           alt: "Custom Fit"
//         },
//         accentColor: "#8B4513",
//               direction: "right" // NEW

//       }
//     ],
//     []
//   );

//   // Auto change slide with animation
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setIsAnimating(true);
//       setTimeout(() => {
//         setCurrentSlide((prev) => (prev + 1) % slidesData.length);
//         setIsAnimating(false);
//       }, 1000); // 2s blur transition
//     }, 8000); // slide stays for 5s

//     return () => clearInterval(timer);
//   }, [slidesData.length]);

//   return (
//     <div className="slideshow-container">
//       {/* Top Bar */}
//       {/* <div className="slide-topbar">
//         <img src="/logo-rec.png" alt="Logo" className="slide-logo-top" />
//         <h1 className="slide-hero-top-heading">Your Personally</h1>
//       </div> */}
//       <div className="slide-topbar">
//   <div className="topbar-left">
//     <img src="/logo-rec.png" alt="Logo" className="slide-logo-top" />
//   </div>
//   {/* <h1 className="slide-hero-top-heading">Your Personally</h1> */}
// </div>

//       {/* Slides */}
//       {slidesData.map((slide, index) => (
//         // <div
//         //   key={slide.id}
//         //   className={`slide ${
//         //     index === currentSlide ? "active" : ""
//         //   } ${isAnimating ? "blur-out" : ""}`}
//         //   style={{ backgroundImage: `url(${slide.media.src})` }}
//         //   aria-hidden={index !== currentSlide}
//         // >
//         //   <div className="slide-overlay"></div>
//         //   <div className="text-overlay-box">
//         //     <h2 className="slide-heading">{slide.heroHeading}</h2>
//         //     <p>
//         //       {slide.content.map((text, idx) => (
//         //         <span key={idx} className="slide-text">
//         //           {text}
//         //         </span>
//         //       ))}
//         //     </p>
//         //     <button
//         //       className="slide-cta-button"
//         //       onClick={() => navigate("/personalise")}
//         //       style={{ backgroundColor: slide.accentColor }}
//         //     >
//         //       <span>GO PERSONALISE</span>
//         //       <ArrowRight size={20} />
//         //     </button>
//         //   </div>
//         // </div>
//         <div
//   key={slide.id}
//   className={`slide ${index === currentSlide ? `active slide-${slide.direction}` : ""} ${isAnimating ? "blur-out" : ""}`}
//   style={{ backgroundImage: `url(${slide.media.src})` }}
//   aria-hidden={index !== currentSlide}
// >
//   <div className="slide-overlay"></div>
//   <div className="text-overlay-box">
//   <h1 className="slide-hero-top-heading">Your Personally</h1>

//     <h2 className="slide-heading">{slide.heroHeading}</h2>
//     <p>
//       {slide.content.map((text, idx) => (
//         <span key={idx} className="slide-text">
//           {text}
//         </span>
//       ))}
//     </p>
//     <button
//       className="slide-cta-button"
//       onClick={() => navigate("/personalise")}
//       style={{ backgroundColor: slide.accentColor }}
//     >
//       <span>GO PERSONALISE</span>
//       <ArrowRight size={20} />
//     </button>
//   </div>
// </div>

//       ))}
//     </div>
//   );
// };

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
        <img src="/logo-rec - Copy.png" alt="Logo" className="slide-logo-top" /> 
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