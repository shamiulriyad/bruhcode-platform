import React, { useMemo } from 'react';

/**
 * Circular SVG countdown timer with smooth animation.
 * Changes color: sky (>60s) → amber (≤60s) → red (≤10s, pulsing).
 * Respects prefers-reduced-motion.
 */
export default function CountdownRing({
  totalSeconds = 3600,
  remainingSeconds = 0,
  size = 200,
  strokeWidth = 8,
  className = '',
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const offset = circumference * (1 - progress);

  const color = useMemo(() => {
    if (remainingSeconds <= 10) return '#ef4444'; // red
    if (remainingSeconds <= 60) return '#f59e0b'; // amber
    return '#38bdf8'; // sky
  }, [remainingSeconds]);

  const isPulsing = remainingSeconds <= 10 && remainingSeconds > 0;

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      className={`countdown-ring-container ${className}`}
      style={{ position: 'relative', width: size, height: size }}
    >
      <style>{`
        .countdown-ring-container svg {
          transform: rotate(-90deg);
        }
        .countdown-ring-progress {
          transition: stroke-dashoffset 1s linear, stroke 0.3s ease;
        }
        .countdown-ring-pulse {
          animation: ring-pulse 0.5s ease-in-out infinite alternate;
        }
        @keyframes ring-pulse {
          from { opacity: 1; transform: rotate(-90deg) scale(1); }
          to   { opacity: 0.7; transform: rotate(-90deg) scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          .countdown-ring-progress {
            transition: none;
          }
          .countdown-ring-pulse {
            animation: none;
          }
        }
      `}</style>

      <svg
        width={size}
        height={size}
        className={isPulsing ? 'countdown-ring-pulse' : ''}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          className="countdown-ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color}44)` }}
        />
      </svg>

      {/* Center text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: size * 0.18,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#f1f5f9',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatTime(remainingSeconds)}
        </span>
        <span style={{ fontSize: size * 0.06, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.12em' }}>
          REMAINING
        </span>
      </div>
    </div>
  );
}
