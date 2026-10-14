import React from 'react';

/*
 * BRUHCODE symbol: a "B" built from two ">" prompt chevrons, with a "_" cursor
 * as its base. Same geometry as branding/build.mjs. The cursor can blink like a
 * terminal caret (disabled automatically for reduced-motion users).
 */
const BODY =
  'M0 0H18L32 14L24 22L36 34L30 40H0Z' +
  'M8 8H14.69L20.69 14L14.69 20H8Z' +
  'M8 28H18.69L24.69 34L18.69 40H8Z';
const CURSOR = 'M0 40H30L22 48H0Z';

export default function BrandMark({ size = 28, blink = false, color = '#F5F5F0', cursor = '#B6FF5C', className = '' }) {
  return (
    <svg
      viewBox="0 0 36 48"
      width={(size * 36) / 48}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <style>{`
        @keyframes bm-blink { 0%, 55% { opacity: 1; } 60%, 95% { opacity: 0.15; } 100% { opacity: 1; } }
        .bm-cursor-blink { animation: bm-blink 1.4s steps(1, end) infinite; }
        @media (prefers-reduced-motion: reduce) { .bm-cursor-blink { animation: none; } }
      `}</style>
      <path d={BODY} fill={color} fillRule="evenodd" />
      <path d={CURSOR} fill={cursor} className={blink ? 'bm-cursor-blink' : undefined} />
    </svg>
  );
}
