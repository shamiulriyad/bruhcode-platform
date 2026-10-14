import React, { useId } from 'react';
import { motion } from 'framer-motion';

/*
 * Shared "<+>" brand mark — two code-bracket chevrons with a plus fused
 * in the gap between them. Reads as "BRUHCODE" without needing the
 * wordmark alongside it. Same sky-400 → emerald-400 gradient used for
 * the CP badge in Navbar.jsx.
 *
 * `pieceVariants` (optional) lets a parent drive an entrance animation
 * per piece — { left, right, plus } — each a framer-motion variants
 * object with "hidden"/"visible" keys. Pass `initial`/`animate` to
 * trigger it. Without pieceVariants, the mark renders as a static SVG.
 */
export default function LogoMark({
  size = 32,
  pieceVariants,
  initial,
  animate,
  className = '',
  style,
}) {
  const gradId = `cp-logo-grad-${useId()}`;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      style={style}
      initial={initial}
      animate={animate}
    >
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <motion.path
        d="M13 6 L5 16 L13 26"
        stroke={`url(#${gradId})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={pieceVariants?.left}
      />
      <motion.path
        d="M19 6 L27 16 L19 26"
        stroke={`url(#${gradId})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={pieceVariants?.right}
      />
      <motion.path
        d="M13.5 16 L18.5 16"
        stroke={`url(#${gradId})`}
        strokeWidth="3"
        strokeLinecap="round"
        variants={pieceVariants?.plus}
      />
      <motion.path
        d="M16 13.5 L16 18.5"
        stroke={`url(#${gradId})`}
        strokeWidth="3"
        strokeLinecap="round"
        variants={pieceVariants?.plus}
      />
    </motion.svg>
  );
}
