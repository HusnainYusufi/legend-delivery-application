// src/components/Splash.jsx
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import logoUrl from "/sh-logo.png";

const LETTERS = "SHAHEENE".split("");

export default function Splash() {
  const ringRefs = [useRef(null), useRef(null), useRef(null)];
  const logoRef = useRef(null);
  const brandRef = useRef(null);
  const taglineRef = useRef(null);
  const lineRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Rings pulse outward like radar
    const ringTweens = ringRefs.map((r, i) =>
      gsap.fromTo(r.current,
        { scale: 0.2, opacity: 0 },
        {
          scale: 1, opacity: 1,
          duration: 1.4 + i * 0.2,
          ease: "power2.out",
          delay: i * 0.18,
          repeat: -1,
          yoyo: false,
          onRepeat() {
            gsap.set(r.current, { scale: 0.2, opacity: 0 });
          }
        }
      )
    );

    // Center dot pulses
    tl.fromTo(dotRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" }
    );

    // Logo scales in with elastic
    tl.fromTo(logoRef.current,
      { scale: 0, rotation: -15, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.55)" },
      "-=0.1"
    );

    // Letters stagger in
    const letters = brandRef.current.querySelectorAll(".sp-letter");
    tl.fromTo(letters,
      { y: 28, opacity: 0, rotationX: -60 },
      { y: 0, opacity: 1, rotationX: 0, stagger: 0.045, duration: 0.55, ease: "power3.out" },
      "-=0.35"
    );

    // Tagline
    tl.fromTo(taglineRef.current,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4 },
      "-=0.15"
    );

    // Bottom progress bar
    tl.fromTo(lineRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.9, ease: "power2.inOut", transformOrigin: "left center" },
      "-=0.2"
    );

    return () => {
      ringTweens.forEach((tw) => tw.kill());
      tl.kill();
    };
  }, []);

  return (
    <motion.div
      className="splash-wrapper"
      exit={{ opacity: 0, scale: 1.08, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } }}
    >
      {/* Radar rings */}
      <div className="splash-rings" aria-hidden="true">
        {ringRefs.map((r, i) => (
          <div
            key={i}
            ref={r}
            className="splash-ring"
            style={{ width: `${220 + i * 90}px`, height: `${220 + i * 90}px`, opacity: 0 }}
          />
        ))}
        {/* Center pulse dot */}
        <div ref={dotRef} className="splash-center-dot" style={{ opacity: 0 }} />
      </div>

      {/* Content */}
      <div className="splash-content-block">
        {/* Logo */}
        <div ref={logoRef} className="splash-logo-wrap" style={{ opacity: 0 }}>
          <img src={logoUrl} alt="SHAHEENE" className="splash-logo-img" />
        </div>

        {/* Brand letters */}
        <div ref={brandRef} className="splash-brand-row" aria-label="SHAHEENE">
          {LETTERS.map((l, i) => (
            <span key={i} className="sp-letter splash-letter">{l}</span>
          ))}
        </div>

        {/* Tagline */}
        <p ref={taglineRef} className="splash-tagline" style={{ opacity: 0 }}>
          Delivery Intelligence Platform
        </p>

        {/* Progress line */}
        <div className="splash-line-track">
          <div ref={lineRef} className="splash-line-fill" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </motion.div>
  );
}
