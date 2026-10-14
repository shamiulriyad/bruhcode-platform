import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import LogoMark from './LogoMark';

const bracketVariants = (fromX) => ({
  hidden: { x: fromX, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
});

const plusVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 320, damping: 18, delay: 0.2 } },
};

/*
 * Navbar logo mark — plays its bracket/plus entrance once on mount
 * (Navbar itself only mounts once per session, so this never re-plays
 * on route changes). Hover gives a small scale + 3D tilt; no idle
 * "breathing" loop here — that's reserved for the hero version only,
 * since a persistent nav element shouldn't pulse forever.
 */
export default function Logo({ size = 32, className = '' }) {
  const shouldReduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const pieceVariants = shouldReduceMotion
    ? undefined
    : { left: bracketVariants(-8), right: bracketVariants(8), plus: plusVariants };

  return (
    <div
      className={className}
      style={{ perspective: 400 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        animate={{
          scale: hovered && !shouldReduceMotion ? 1.05 : 1,
          rotateY: hovered && !shouldReduceMotion ? 12 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        style={{ position: 'relative', width: size, height: size, transformStyle: 'preserve-3d' }}
      >
        {/* Depth layers behind the front mark — same gradient, darker via brightness filter, offset in z/x/y for an "extruded" feel */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          style={{ position: 'absolute', inset: 0, transform: 'translateZ(-6px) translate(1.5px, 1.5px)', filter: 'brightness(0.6)' }}
        >
          <LogoMark size={size} />
        </motion.div>
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          style={{ position: 'absolute', inset: 0, transform: 'translateZ(-3px) translate(0.75px, 0.75px)', filter: 'brightness(0.82)' }}
        >
          <LogoMark size={size} />
        </motion.div>

        {/* Front layer — the one that plays the piece-by-piece entrance */}
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
  );
}
