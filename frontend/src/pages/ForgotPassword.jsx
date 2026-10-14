import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../api';

/* ─── Styles ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes fadeRight {
    from { opacity: 0; transform: translateX(-16px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes floatOrb {
    0%,100% { transform: translateY(0) scale(1); }
    50%      { transform: translateY(-20px) scale(1.05); }
  }
  @keyframes orbPulse {
    0%,100% { opacity: 0.18; } 50% { opacity: 0.3; }
  }
  @keyframes scanline {
    0% { top: -6%; } 100% { top: 106%; }
  }
  @keyframes spin {
    from { transform: rotate(0deg); } to { transform: rotate(360deg); }
  }
  @keyframes ripple {
    0%   { transform: scale(0); opacity: 0.5; }
    100% { transform: scale(4); opacity: 0; }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes stepSlideIn {
    from { opacity: 0; transform: translateX(30px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes stepSlideOut {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(-30px); }
  }
  @keyframes borderGlow {
    0%,100% { box-shadow: 0 0 0 0 rgba(56,189,248,0); }
    50%      { box-shadow: 0 0 12px 3px rgba(56,189,248,0.15); }
  }
  @keyframes timerShrink {
    from { width: 100%; }
    to   { width: 0%; }
  }
  @keyframes otpPop {
    0%   { transform: scale(0.85); opacity: 0; }
    70%  { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes successPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
    50%      { box-shadow: 0 0 0 8px rgba(52,211,153,0.15); }
  }
  @keyframes dotBlink {
    0%,100% { opacity: 1; } 50% { opacity: 0.2; }
  }
  @keyframes checkDraw {
    from { stroke-dashoffset: 40; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes countdownPulse {
    0%,100% { color: rgba(148,163,184,1); }
    50%      { color: rgba(248,113,113,1); }
  }

  .fp-page * { font-family: 'Sora', sans-serif; box-sizing: border-box; }

  .card-enter { animation: fadeUp 0.65s cubic-bezier(.22,.68,0,1.2) both; }

  .orb { position:absolute; border-radius:50%; filter:blur(60px); pointer-events:none; }
  .orb-1 { width:300px;height:300px;
    background:radial-gradient(circle,rgba(14,165,233,0.2),transparent 70%);
    top:-80px;left:-80px;
    animation: floatOrb 8s ease-in-out infinite, orbPulse 8s ease-in-out infinite; }
  .orb-2 { width:220px;height:220px;
    background:radial-gradient(circle,rgba(6,182,212,0.15),transparent 70%);
    bottom:-50px;right:-50px;
    animation: floatOrb 11s ease-in-out 2s infinite reverse, orbPulse 11s ease-in-out 2s infinite; }
  .orb-3 { width:160px;height:160px;
    background:radial-gradient(circle,rgba(52,211,153,0.1),transparent 70%);
    top:50%;left:60%;
    animation: floatOrb 14s ease-in-out 4s infinite, orbPulse 14s ease-in-out 4s infinite; }

  .scanline-wrap { position:absolute;inset:0;overflow:hidden;border-radius:1.25rem;pointer-events:none;z-index:1; }
  .scanline { position:absolute;left:0;right:0;height:2px;
    background:linear-gradient(90deg,transparent,rgba(56,189,248,0.1),transparent);
    animation: scanline 5s linear infinite; }

  .noise {
    position:absolute;inset:0;border-radius:1.25rem;pointer-events:none;z-index:0;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    opacity:0.025;
  }

  .btn-ripple { position:relative;overflow:hidden; }
  .btn-ripple .ripple-el {
    position:absolute;border-radius:50%;
    background:rgba(255,255,255,0.3);
    width:80px;height:80px;margin-top:-40px;margin-left:-40px;
    animation: ripple 0.6s linear forwards;pointer-events:none;
  }

  .badge-shimmer { position:relative;overflow:hidden; }
  .badge-shimmer::after {
    content:'';position:absolute;inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);
    background-size:400px 100%;
    animation:shimmer 2.6s linear infinite;
  }

  /* Step panel animation */
  .step-panel { animation: stepSlideIn 0.4s cubic-bezier(.22,.68,0,1.2) both; }

  /* OTP input boxes */
  .otp-box {
    width:48px;height:56px;border-radius:14px;
    border:1.5px solid rgba(255,255,255,0.1);
    background:#020b18;
    color:#fff;font-size:22px;font-weight:700;
    text-align:center;outline:none;
    transition:border-color 0.2s,box-shadow 0.2s,transform 0.15s;
    animation: otpPop 0.4s cubic-bezier(.22,.68,0,1.2) both;
    caret-color:transparent;
  }
  .otp-box:focus {
    border-color:rgba(56,189,248,0.7);
    box-shadow:0 0 0 3px rgba(56,189,248,0.12);
    transform:scale(1.06);
  }
  .otp-box.filled {
    border-color:rgba(52,211,153,0.55);
    box-shadow:0 0 0 3px rgba(52,211,153,0.1);
  }

  /* Field input */
  .fp-input {
    width:100%;border-radius:1rem;
    border:1.5px solid rgba(255,255,255,0.1);
    background:#020b18;
    padding:12px 16px;color:#fff;outline:none;
    transition:border-color 0.25s,box-shadow 0.25s;
    font-family:'Sora',sans-serif;font-size:14px;
  }
  .fp-input::placeholder { color:rgba(100,116,139,1); }
  .fp-input:focus {
    border-color:rgba(56,189,248,0.6);
    box-shadow:0 0 0 3px rgba(56,189,248,0.1);
    animation:borderGlow 1.8s ease-in-out infinite;
  }
  .fp-input.success {
    border-color:rgba(52,211,153,0.55);
    box-shadow:0 0 0 3px rgba(52,211,153,0.1);
  }

  /* Timer bar */
  .timer-bar-fill {
    height:100%;border-radius:99px;
    background:linear-gradient(90deg,#38bdf8,#22d3ee);
    transition:background 0.5s;
  }
  .timer-bar-fill.warn { background:linear-gradient(90deg,#f97316,#ef4444); }

  /* Step indicator dot */
  .step-dot {
    width:8px;height:8px;border-radius:50%;
    transition:all 0.35s cubic-bezier(.22,.68,0,1.2);
  }

  /* Password strength bar */
  .strength-bar { height:3px;border-radius:99px;transition:all 0.4s ease; }

  /* Live dot */
  .live-dot { animation: dotBlink 1.4s ease-in-out infinite; }

  /* Check icon draw */
  .check-path {
    stroke-dasharray:40;
    animation:checkDraw 0.5s ease 0.1s both;
  }

  /* Success card glow */
  .success-glow { animation: successPulse 2s ease-in-out infinite; }

  /* Countdown urgent */
  .urgent { animation: countdownPulse 0.8s ease-in-out infinite; }
`;

/* ─── Ripple button ─── */
function RippleButton({ children, className = '', style, ...props }) {
  const [ripples, setRipples] = useState([]);
  const add = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(r => [...r, { id, left: e.clientX - rect.left, top: e.clientY - rect.top }]);
    setTimeout(() => setRipples(r => r.filter(x => x.id !== id)), 620);
  };
  return (
    <button {...props} onMouseDown={add} className={`btn-ripple ${className}`} style={style}>
      {ripples.map(r => <span key={r.id} className="ripple-el" style={{ left: r.left, top: r.top }} />)}
      {children}
    </button>
  );
}

/* ─── Loading spinner inline ─── */
function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2"
        strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Step top indicator ─── */
function StepBar({ step }) {
  const steps = ['Email', 'Verify OTP', 'New password'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((label, i) => {
        const done   = step > i + 1;
        const active = step === i + 1;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 64 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? 'rgba(52,211,153,0.2)' : active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
                border: done ? '1.5px solid rgba(52,211,153,0.5)' : active ? '1.5px solid rgba(56,189,248,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.35s ease',
              }}>
                {done ? (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path className="check-path" d="M2 6.5L5 9.5L11 3.5" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#38bdf8' : 'rgba(100,116,139,1)' }}>{i + 1}</span>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: done ? '#34d399' : active ? '#e2e8f0' : 'rgba(100,116,139,0.7)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 1.5, marginBottom: 20,
                background: done ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.07)',
                transition: 'background 0.4s ease',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── OTP boxes ─── */
function OtpInput({ value, onChange }) {
  const refs = useRef([]);
  const digits = value.split('');

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next);
      if (i > 0) refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      refs.current[i + 1]?.focus();
    }
  };

  const handleInput = (i, e) => {
    const char = e.target.value.replace(/[^0-9]/g, '').slice(-1);
    if (!char) return;
    const arr = value.split('');
    arr[i] = char;
    const next = arr.join('').slice(0, 6);
    onChange(next);
    if (i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          className={`otp-box${digits[i] ? ' filled' : ''}`}
          style={{ animationDelay: `${i * 0.06}s` }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onChange={e => handleInput(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

/* ─── Password strength ─── */
function PasswordStrength({ password }) {
  if (!password) return null;
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(password) ? 1 : 0);
  const levels = [
    { label: 'Weak',   color: '#ef4444', w: '25%' },
    { label: 'Fair',   color: '#f97316', w: '50%' },
    { label: 'Good',   color: '#eab308', w: '75%' },
    { label: 'Strong', color: '#22c55e', w: '100%' },
  ];
  const lvl = levels[Math.max(0, score - 1)];
  return (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)' }}>
        <div className="strength-bar" style={{ width: lvl.w, background: lvl.color }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: lvl.color, minWidth: 40 }}>{lvl.label}</span>
    </div>
  );
}

/* ─── Timer bar ─── */
function TimerBar({ secondsLeft, total = 60 }) {
  const pct = (secondsLeft / total) * 100;
  const warn = secondsLeft <= 15;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', fontWeight: 500 }}>OTP expires in</span>
        <span
          className={`font-mono text-sm font-bold ${warn ? 'urgent' : ''}`}
          style={{ color: warn ? '#f87171' : '#38bdf8', fontFamily: 'monospace' }}
        >
          {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div
          className={`timer-bar-fill${warn ? ' warn' : ''}`}
          style={{ width: `${pct}%`, transition: 'width 0.5s linear, background 0.5s' }}
        />
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1);
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp]         = useState('');
  const [resetToken, setResetToken]         = useState(null);
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [expiresAt, setExpiresAt]           = useState(null);
  const [secondsLeft, setSecondsLeft]       = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const s = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(s);
      if (s <= 0) { clearInterval(timerRef.current); timerRef.current = null; }
    };
    tick();
    timerRef.current = window.setInterval(tick, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [expiresAt]);

  const startRequest = async () => {
    if (!email) return toast.error('Enter your registered email');
    try {
      setLoading(true);
      await authAPI.requestPasswordReset({ email });
      setExpiresAt(Date.now() + 60 * 1000);
      setStep(2);
      toast.success('OTP sent — check your inbox');
    } catch { toast.error('Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const resendOtp = async () => {
    try {
      setLoading(true);
      await authAPI.requestPasswordReset({ email });
      setExpiresAt(Date.now() + 60 * 1000);
      setOtp('');
      toast.success('OTP resent');
    } catch { toast.error('Failed to resend OTP'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length < 6) return toast.error('Enter the full 6-digit code');
    try {
      setLoading(true);
      const res = await authAPI.verifyResetOtp({ email, code: otp });
      setResetToken(res.data.resetToken);
      setStep(3);
      toast.success('OTP verified — set a new password');
    } catch (err) {
      toast.error(err?.response?.data || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const submitNewPassword = async () => {
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    try {
      setLoading(true);
      await authAPI.resetPassword({ email, resetToken, newPassword });
      toast.success('Password updated — please log in');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  const passwordMatch = confirmPassword && newPassword === confirmPassword;
  const passwordMismatch = confirmPassword && newPassword !== confirmPassword;

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="fp-page relative w-full"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
          padding: '3rem 1rem',
          overflow: 'hidden',
        }}
      >
        {/* Orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div
          className="relative mx-auto flex items-center justify-center"
          style={{ maxWidth: 560, minHeight: 'calc(100vh - 6rem)', zIndex: 10 }}
        >
          <div
            className="card-enter w-full rounded-[1.25rem] border border-white/6 bg-white/3 shadow-xl backdrop-blur-lg"
            style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}
          >
            <div className="noise" />
            <div className="scanline-wrap"><div className="scanline" /></div>

            <div style={{ position: 'relative', zIndex: 3 }}>

              {/* Badge */}
              <div className="badge-shimmer inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-300"
                style={{ animation: 'fadeUp 0.4s ease 0.1s both' }}>
                Account recovery
              </div>

              <h1
                className="mt-5 text-3xl font-semibold tracking-tight text-white"
                style={{ animation: 'fadeUp 0.45s ease 0.2s both' }}
              >
                Forgot your password?
              </h1>
              <p
                className="mt-2 text-sm leading-6 text-slate-400"
                style={{ animation: 'fadeUp 0.45s ease 0.28s both' }}
              >
                Secure 3-step recovery. OTP expires in 60 seconds.
              </p>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0', animation: 'fadeIn 0.4s ease 0.35s both' }} />

              {/* Step bar */}
              <div style={{ animation: 'fadeUp 0.4s ease 0.4s both' }}>
                <StepBar step={step} />
              </div>

              {/* ── Step 1: Email ── */}
              {step === 1 && (
                <div className="step-panel">
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(203,213,225,1)', marginBottom: 8 }}>
                    Registered email
                  </label>
                  <input
                    type="email"
                    className="fp-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && startRequest()}
                    placeholder="you@example.com"
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                    <RippleButton
                      onClick={startRequest}
                      disabled={loading || !email}
                      className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(90deg,#38bdf8,#22d3ee)', flex: 1 }}
                    >
                      {loading
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Spinner />Sending…</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            Send OTP
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                      }
                    </RippleButton>
                    <Link
                      to="/login"
                      className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:border-white/20 transition-colors"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M12 7H2M6 3L2 7l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Back
                    </Link>
                  </div>

                  {/* Security note */}
                  <div style={{
                    marginTop: 20, padding: '12px 14px', borderRadius: 12,
                    background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.12)',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
                    <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.8)', lineHeight: 1.6, margin: 0 }}>
                      We'll send a one-time code to this email. If you didn't request a reset, ignore any email you receive.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Step 2: OTP ── */}
              {step === 2 && (
                <div className="step-panel">
                  {/* Email display */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                    borderRadius: 10, background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20,
                  }}>
                    <div className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#38bdf8', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.8)' }}>Code sent to</span>
                    <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{email}</span>
                  </div>

                  <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.8)', textAlign: 'center', marginBottom: 16 }}>
                    Enter the 6-digit code
                  </p>

                  <OtpInput value={otp} onChange={setOtp} />

                  <TimerBar secondsLeft={secondsLeft} />

                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <RippleButton
                      onClick={verifyOtp}
                      disabled={loading || otp.length < 6}
                      className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(90deg,#34d399,#22d3ee)', flex: 1 }}
                    >
                      {loading
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><Spinner />Verifying…</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            Verify OTP
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                      }
                    </RippleButton>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <RippleButton
                      onClick={resendOtp}
                      disabled={loading || secondsLeft > 0}
                      className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-white/20 transition-colors"
                      style={{ flex: 1, background: 'transparent' }}
                    >
                      {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend OTP'}
                    </RippleButton>
                    <RippleButton
                      onClick={() => setStep(1)}
                      className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:border-white/20 transition-colors"
                      style={{ background: 'transparent' }}
                    >
                      Change email
                    </RippleButton>
                  </div>
                </div>
              )}

              {/* ── Step 3: New password ── */}
              {step === 3 && (
                <div className="step-panel">
                  {/* Success badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    borderRadius: 12, background: 'rgba(52,211,153,0.08)',
                    border: '1px solid rgba(52,211,153,0.2)', marginBottom: 20,
                  }} className="success-glow">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="8" stroke="#34d399" strokeWidth="1.5"/>
                      <path className="check-path" d="M5.5 9L8 11.5L12.5 6.5" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>Identity verified — set your new password</span>
                  </div>

                  {/* New password */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(203,213,225,1)', marginBottom: 8 }}>
                      New password
                    </label>
                    <input
                      type="password"
                      className="fp-input"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoFocus
                    />
                    <PasswordStrength password={newPassword} />
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: passwordMismatch ? '#f87171' : passwordMatch ? '#34d399' : 'rgba(203,213,225,1)' }}>
                      Confirm password
                      {passwordMatch    && <span style={{ marginLeft: 8, fontSize: 11 }}>✓ Matches</span>}
                      {passwordMismatch && <span style={{ marginLeft: 8, fontSize: 11 }}>✗ Doesn't match</span>}
                    </label>
                    <input
                      type="password"
                      className={`fp-input${passwordMatch ? ' success' : ''}`}
                      style={{ borderColor: passwordMismatch ? 'rgba(248,113,113,0.55)' : passwordMatch ? 'rgba(52,211,153,0.55)' : '' }}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
                    <RippleButton
                      onClick={submitNewPassword}
                      disabled={loading || !newPassword || newPassword !== confirmPassword}
                      className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(90deg,#34d399,#84cc16)', flex: 1 }}
                    >
                      {loading
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><Spinner />Updating…</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            Set new password
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                      }
                    </RippleButton>
                    <RippleButton
                      onClick={() => setStep(2)}
                      className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 hover:border-white/20 transition-colors"
                      style={{ background: 'transparent' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M12 7H2M6 3L2 7l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </RippleButton>
                  </div>
                </div>
              )}

              {/* Bottom link */}
              <div style={{ marginTop: 24, textAlign: 'center', animation: 'fadeIn 0.4s ease 0.6s both' }}>
                <Link to="/login" style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', transition: 'color 0.2s' }}
                  className="hover:text-sky-400">
                  ← Back to login
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}