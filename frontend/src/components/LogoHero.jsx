import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import LogoMark from './LogoMark';

const bracketVariants = (fromX) => ({
  hidden: { x: fromX, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 200, damping: 18 } },
});

const plusVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 16, delay: 0.25 } },
};

/*
 * Larger hero/landing version of the logo: entrance animation, a slow
 * idle "breathing" scale loop, and a cursor-follow 3D tilt (manual
 * mousemove + spring-smoothed motion values — no extra tilt library
 * needed since framer-motion already covers it).
 *
 * `showWordmark` renders the "CodePulse" lockup beside the mark using
 * the same sky→emerald gradient text already used elsewhere (About.jsx
 * hero heading, BrainGymHome title).
 */
export default function LogoHero({ size = 96, showWordmark = false, className = '' }) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef(null);
  const [entranceDone, setEntranceDone] = useState(false);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 150, damping: 15 });
  const springY = useSpring(rotateY, { stiffness: 150, damping: 15 });

  const pieceVariants = shouldReduceMotion
    ? undefined
    : { left: bracketVariants(-24), right: bracketVariants(24), plus: plusVariants };

  // Switch from entrance to idle breathing once the piece animations have
  // settled (~700ms covers the staggered bracket/plus spring transitions).
  useEffect(() => {
    if (shouldReduceMotion) return;
    const t = setTimeout(() => setEntranceDone(true), 700);
    return () => clearTimeout(t);
  }, [shouldReduceMotion]);

  const handleMouseMove = (e) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 24);
    rotateX.set(-py * 14);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <div className={`inline-flex items-center gap-4 ${className}`}>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: 700 }}
      >
        <motion.div
          style={{
            position: 'relative',
            width: size,
            height: size,
            transformStyle: 'preserve-3d',
            rotateX: shouldReduceMotion ? 0 : springX,
            rotateY: shouldReduceMotion ? 0 : springY,
          }}
          animate={shouldReduceMotion || !entranceDone ? undefined : { scale: [1, 1.02, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Depth layers — same gradient, darker via brightness filter, offset in z/x/y */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            style={{ position: 'absolute', inset: 0, transform: 'translateZ(-16px) translate(4px, 4px)', filter: 'brightness(0.55)' }}
          >
            <LogoMark size={size} />
          </motion.div>
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            style={{ position: 'absolute', inset: 0, transform: 'translateZ(-8px) translate(2px, 2px)', filter: 'brightness(0.8)' }}
          >
            <LogoMark size={size} />
          </motion.div>

          {/* Front layer — plays the piece-by-piece entrance */}
          <div style={{ position: 'relative', transform: 'translateZ(0)' }}>
            <LogoMark
              size={size}
              pieceVariants={pieceVariants}
              initial={shouldReduceMotion ? false : 'hidden'}
              animate="visible"
            />
          </div>
        </motion.div>
      </div>

      {showWordmark && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          className="flex flex-col"
        >
          <span className="text-3xl md:text-5xl font-black tracking-tight">
            <span className="text-white">Code</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">Pulse</span>
          </span>
        </motion.div>
      )}
    </div>
  );
}
