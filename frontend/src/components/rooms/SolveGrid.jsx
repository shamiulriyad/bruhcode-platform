import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SolveGrid — "Who solved what" matrix.
 * Rows = members, Columns = problems.
 * Animate checkmark draw-in + mini confetti on solve.
 */
export default function SolveGrid({ members = [], problems = [], grid = {}, onCellClick }) {
  return (
    <div className="solve-grid-wrapper">
      <style>{`
        .solve-grid-wrapper {
          background: linear-gradient(180deg, rgba(15,23,42,0.7), rgba(15,23,42,0.5));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 16px;
          overflow-x: auto;
          backdrop-filter: blur(12px);
        }
        .solve-grid-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .solve-grid-header h3 {
          font-size: 14px;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0;
        }
        .solve-grid table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 3px;
        }
        .solve-grid th {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          padding: 6px 8px;
          text-align: center;
          letter-spacing: 0.05em;
        }
        .solve-grid td {
          text-align: center;
          padding: 0;
        }
        .solve-cell {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          margin: 0 auto;
        }
        .solve-cell:hover {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.04);
        }
        .solve-cell.solved {
          background: rgba(52,211,153,0.08);
          border-color: rgba(52,211,153,0.25);
        }
        .solve-cell.attempted {
          background: rgba(251,191,36,0.08);
          border-color: rgba(251,191,36,0.2);
        }
        .member-name-cell {
          text-align: left !important;
          padding: 4px 8px !important;
          white-space: nowrap;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 12px;
          font-weight: 600;
          color: #cbd5e1;
        }
        .check-draw {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: draw-check 0.4s ease forwards;
        }
        @keyframes draw-check {
          to { stroke-dashoffset: 0; }
        }
        .solve-flash {
          animation: cell-flash 0.6s ease;
        }
        @keyframes cell-flash {
          0% { box-shadow: 0 0 0 0 rgba(52,211,153,0.4); }
          50% { box-shadow: 0 0 12px 4px rgba(52,211,153,0.3); }
          100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
        }
        .confetti-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          pointer-events: none;
          animation: confetti-burst 0.8s ease-out forwards;
        }
        @keyframes confetti-burst {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .check-draw { animation: none; stroke-dashoffset: 0; }
          .solve-flash { animation: none; }
          .confetti-particle { animation: none; display: none; }
        }
      `}</style>

      <div className="solve-grid-header">
        <span style={{ fontSize: 16 }}>📊</span>
        <h3>Solve Grid</h3>
      </div>

      <div className="solve-grid">
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Member</th>
              {problems.map((p) => (
                <th key={p.id}>{p.problemIndex}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.userId}>
                <td className="member-name-cell">{member.displayName}</td>
                {problems.map((problem) => {
                  const cellData = grid?.[member.userId]?.[problem.id];
                  const status = cellData?.status || 'Unattempted';
                  return (
                    <td key={problem.id}>
                      <SolveCell
                        status={status}
                        attempts={cellData?.attempts}
                        solvedAt={cellData?.solvedAt}
                        onClick={() => onCellClick?.(member.userId, problem.id)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SolveCell({ status, attempts, onClick }) {
  const cellRef = useRef(null);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const prevStatus = useRef(status);

  React.useEffect(() => {
    if (prevStatus.current !== 'Solved' && status === 'Solved') {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 900);
      return () => clearTimeout(t);
    }
    prevStatus.current = status;
  }, [status]);

  const CONFETTI_COLORS = ['#34d399', '#fbbf24', '#38bdf8', '#f472b6', '#a78bfa'];

  return (
    <div
      ref={cellRef}
      className={`solve-cell ${status === 'Solved' ? 'solved solve-flash' : ''} ${
        status === 'Attempted' ? 'attempted' : ''
      }`}
      onClick={onClick}
      title={status === 'Solved' ? `Solved (${attempts} attempts)` : status === 'Attempted' ? `Attempted (${attempts})` : 'Not attempted'}
    >
      <AnimatePresence mode="wait">
        {status === 'Solved' && (
          <motion.div
            key="solved"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                className="check-draw"
                d="M4 10L8 14L16 6"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        )}
        {status === 'Attempted' && (
          <motion.span
            key="attempted"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ fontSize: 14 }}
          >
            ⏳
          </motion.span>
        )}
      </AnimatePresence>

      {/* Confetti particles */}
      {showConfetti &&
        Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * 360;
          const dist = 18 + Math.random() * 10;
          const tx = Math.cos((angle * Math.PI) / 180) * dist;
          const ty = Math.sin((angle * Math.PI) / 180) * dist;
          return (
            <span
              key={i}
              className="confetti-particle"
              style={{
                '--tx': `${tx}px`,
                '--ty': `${ty}px`,
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${i * 30}ms`,
              }}
            />
          );
        })}
    </div>
  );
}
