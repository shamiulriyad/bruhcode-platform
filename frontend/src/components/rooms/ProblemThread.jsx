import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ProblemThread — Per-problem discussion panel with anti-spoiler lock animation.
 *
 * When locked: shows a padlock overlay.
 * On unlock: padlock shakes → swaps to open-lock → fades out to reveal the thread.
 */
export default function ProblemThread({
  problemId,
  problemName,
  isLocked = true,
  messages = [],
  onSendMessage,
  currentUserId,
}) {
  const [input, setInput] = useState('');
  const [unlockAnimating, setUnlockAnimating] = useState(false);
  const [wasLocked, setWasLocked] = useState(isLocked);
  const messagesEndRef = useRef(null);

  // Detect unlock transition
  useEffect(() => {
    if (wasLocked && !isLocked) {
      setUnlockAnimating(true);
      const t = setTimeout(() => setUnlockAnimating(false), 1200);
      return () => clearTimeout(t);
    }
    setWasLocked(isLocked);
  }, [isLocked, wasLocked]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage?.(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="problem-thread">
      <style>{`
        .problem-thread {
          background: linear-gradient(180deg, rgba(15,23,42,0.7), rgba(15,23,42,0.5));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 300px;
          backdrop-filter: blur(12px);
          position: relative;
          overflow: hidden;
        }
        .thread-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .thread-header h3 {
          font-size: 14px;
          font-weight: 700;
          color: #e2e8f0;
          margin: 0;
          flex: 1;
        }
        .thread-messages {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .thread-msg {
          display: flex;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
        }
        .thread-msg-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #818cf8, #38bdf8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          flex-shrink: 0;
        }
        .thread-msg-body {
          flex: 1;
          min-width: 0;
        }
        .thread-msg-name {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 2px;
        }
        .thread-msg-content {
          font-size: 13px;
          color: #e2e8f0;
          line-height: 1.5;
          word-wrap: break-word;
          white-space: pre-wrap;
        }
        .thread-msg-time {
          font-size: 9px;
          color: #475569;
          margin-top: 3px;
        }
        .thread-input-area {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }
        .thread-textarea {
          flex: 1;
          resize: none;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          color: #e2e8f0;
          padding: 10px 12px;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          min-height: 40px;
          max-height: 120px;
          transition: border-color 0.2s;
        }
        .thread-textarea:focus {
          border-color: rgba(56,189,248,0.4);
        }
        .thread-textarea::placeholder {
          color: #475569;
        }
        .thread-send-btn {
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid rgba(56,189,248,0.3);
          background: rgba(56,189,248,0.1);
          color: #38bdf8;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .thread-send-btn:hover {
          background: rgba(56,189,248,0.2);
          border-color: rgba(56,189,248,0.5);
        }
        .thread-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .lock-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(15,23,42,0.85);
          backdrop-filter: blur(8px);
          z-index: 10;
          border-radius: 14px;
        }
        .lock-text {
          font-size: 12px;
          color: #64748b;
          margin-top: 12px;
          text-align: center;
          max-width: 200px;
          line-height: 1.5;
        }
        @keyframes lock-shake {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(-15deg); }
          30% { transform: rotate(15deg); }
          45% { transform: rotate(-12deg); }
          60% { transform: rotate(12deg); }
          75% { transform: rotate(-5deg); }
          90% { transform: rotate(5deg); }
        }
        .lock-shaking {
          animation: lock-shake 0.5s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .lock-shaking { animation: none; }
        }
      `}</style>

      {/* Thread Header */}
      <div className="thread-header">
        <span style={{ fontSize: 16 }}>💬</span>
        <h3>{problemName || 'Discussion'}</h3>
        {isLocked && (
          <span style={{ fontSize: 10, color: '#f87171', fontWeight: 700 }}>🔒 LOCKED</span>
        )}
      </div>

      {/* Lock Overlay */}
      <AnimatePresence>
        {(isLocked || unlockAnimating) && (
          <motion.div
            className="lock-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className={unlockAnimating ? 'lock-shaking' : ''}
              initial={{ scale: 1 }}
              animate={
                unlockAnimating
                  ? { scale: [1, 1.3, 1], rotate: [0, -15, 15, -10, 10, 0] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.6 }}
            >
              <span style={{ fontSize: 48 }}>{unlockAnimating ? '🔓' : '🔒'}</span>
            </motion.div>
            <div className="lock-text">
              {unlockAnimating
                ? 'Thread unlocked! 🎉'
                : 'Solve or attempt this problem to unlock the discussion thread.'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="thread-messages">
        {messages.length === 0 && !isLocked && (
          <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: 20 }}>
            No messages yet. Start the discussion!
          </div>
        )}
        {messages.map((msg) => (
          <motion.div
            key={msg.messageId || msg.id}
            className="thread-msg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="thread-msg-avatar">
              {msg.displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="thread-msg-body">
              <div className="thread-msg-name">
                {msg.displayName}
                {msg.userId === currentUserId && <span style={{ color: '#38bdf8', marginLeft: 4 }}>(you)</span>}
              </div>
              <div className="thread-msg-content">{msg.content}</div>
              <div className="thread-msg-time">
                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isLocked && (
        <div className="thread-input-area">
          <textarea
            className="thread-textarea"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your approach..."
          />
          <button
            className="thread-send-btn"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
