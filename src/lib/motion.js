// src/lib/motion.js — shared Framer Motion variants

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0,   transition: { type: "spring", damping: 24, stiffness: 260 } },
  exit:   { opacity: 0, y: 10,  transition: { duration: 0.15, ease: "easeIn" } },
};

export const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const staggerFast = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.045, delayChildren: 0.0 } },
};

export const backdrop = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.22 } },
  exit:   { opacity: 0, transition: { duration: 0.18 } },
};

export const sheet = {
  hidden: { y: "100%" },
  show:   { y: 0, transition: { type: "spring", damping: 32, stiffness: 320 } },
  exit:   { y: "100%", transition: { duration: 0.22, ease: [0.32, 0, 0.67, 0] } },
};

export const page = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.18, ease: "easeIn" } },
};

export const pop = {
  hidden: { opacity: 0, scale: 0.88, y: 10 },
  show:   { opacity: 1, scale: 1,    y: 0,  transition: { type: "spring", damping: 20, stiffness: 350 } },
  exit:   { opacity: 0, scale: 0.92, y: 8,  transition: { duration: 0.15 } },
};

export const slideDown = {
  hidden: { opacity: 0, y: -16 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", damping: 24, stiffness: 280 } },
};
