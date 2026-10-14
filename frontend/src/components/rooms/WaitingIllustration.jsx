import React from 'react';

/**
 * Looping SVG illustration of people sitting around a virtual table.
 * Used as an empty/waiting state placeholder.
 */
export default function WaitingIllustration({ size = 260, className = '' }) {
  return (
    <div className={`waiting-illustration ${className}`} style={{ width: size, margin: '0 auto' }}>
      <style>{`
        .waiting-illustration svg {
          width: 100%;
          height: auto;
        }
        .float-1 { animation: float-anim 3s ease-in-out infinite; }
        .float-2 { animation: float-anim 3.5s ease-in-out 0.3s infinite; }
        .float-3 { animation: float-anim 2.8s ease-in-out 0.6s infinite; }
        .float-4 { animation: float-anim 3.2s ease-in-out 0.9s infinite; }
        .pulse-dot { animation: pulse-anim 2s ease-in-out infinite; }
        @keyframes float-anim {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulse-anim {
          0%, 100% { opacity: 0.3; r: 3; }
          50% { opacity: 1; r: 5; }
        }
        @media (prefers-reduced-motion: reduce) {
          .float-1, .float-2, .float-3, .float-4 { animation: none; }
          .pulse-dot { animation: none; }
        }
      `}</style>

      <svg viewBox="0 0 260 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Table */}
        <ellipse cx="130" cy="130" rx="80" ry="20" fill="rgba(56,189,248,0.06)" stroke="rgba(56,189,248,0.15)" strokeWidth="1" />
        <rect x="90" y="105" width="80" height="30" rx="8" fill="rgba(15,23,42,0.8)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

        {/* Screen on table */}
        <rect x="105" y="108" width="50" height="24" rx="3" fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.2)" strokeWidth="0.5" />
        {/* Code lines on screen */}
        <rect x="109" y="113" width="18" height="2" rx="1" fill="rgba(56,189,248,0.3)" />
        <rect x="109" y="117" width="30" height="2" rx="1" fill="rgba(52,211,153,0.3)" />
        <rect x="109" y="121" width="22" height="2" rx="1" fill="rgba(129,140,248,0.3)" />
        <rect x="109" y="125" width="12" height="2" rx="1" fill="rgba(251,191,36,0.3)" />

        {/* Person 1 — left */}
        <g className="float-1">
          <circle cx="55" cy="88" r="12" fill="rgba(56,189,248,0.15)" stroke="rgba(56,189,248,0.3)" strokeWidth="1" />
          <circle cx="55" cy="85" r="6" fill="rgba(56,189,248,0.25)" />
          <rect x="49" y="92" width="12" height="16" rx="4" fill="rgba(56,189,248,0.12)" />
        </g>

        {/* Person 2 — right */}
        <g className="float-2">
          <circle cx="205" cy="88" r="12" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.3)" strokeWidth="1" />
          <circle cx="205" cy="85" r="6" fill="rgba(52,211,153,0.25)" />
          <rect x="199" y="92" width="12" height="16" rx="4" fill="rgba(52,211,153,0.12)" />
        </g>

        {/* Person 3 — top */}
        <g className="float-3">
          <circle cx="130" cy="60" r="12" fill="rgba(129,140,248,0.15)" stroke="rgba(129,140,248,0.3)" strokeWidth="1" />
          <circle cx="130" cy="57" r="6" fill="rgba(129,140,248,0.25)" />
          <rect x="124" y="64" width="12" height="16" rx="4" fill="rgba(129,140,248,0.12)" />
        </g>

        {/* Person 4 — bottom left */}
        <g className="float-4">
          <circle cx="80" cy="120" r="10" fill="rgba(251,191,36,0.15)" stroke="rgba(251,191,36,0.3)" strokeWidth="1" />
          <circle cx="80" cy="117" r="5" fill="rgba(251,191,36,0.25)" />
          <rect x="75" y="122" width="10" height="14" rx="3" fill="rgba(251,191,36,0.12)" />
        </g>

        {/* Connection dots (thinking/coding indicator) */}
        <circle className="pulse-dot" cx="72" cy="78" r="3" fill="#38bdf8" />
        <circle className="pulse-dot" cx="188" cy="78" r="3" fill="#34d399" style={{ animationDelay: '0.5s' }} />
        <circle className="pulse-dot" cx="130" cy="48" r="3" fill="#818cf8" style={{ animationDelay: '1s' }} />

        {/* WiFi/connection arcs */}
        <path d="M125 22 Q130 16 135 22" stroke="rgba(56,189,248,0.2)" strokeWidth="1" fill="none" />
        <path d="M122 18 Q130 10 138 18" stroke="rgba(56,189,248,0.15)" strokeWidth="1" fill="none" />
        <path d="M119 14 Q130 4 141 14" stroke="rgba(56,189,248,0.1)" strokeWidth="1" fill="none" />

        {/* Text label */}
        <text x="130" y="165" textAnchor="middle" fill="#475569" fontSize="10" fontWeight="600" letterSpacing="0.15em">
          WAITING FOR TEAM
        </text>
      </svg>
    </div>
  );
}
