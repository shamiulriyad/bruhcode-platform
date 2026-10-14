import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI, statsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

/* ─── Keyframes & styles ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
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
  @keyframes dotBlink {
    0%,100% { opacity: 1; } 50% { opacity: 0.2; }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes progressFill {
    from { width: 0%; } to { width: var(--pw); }
  }
  @keyframes stepPop {
    0%   { transform: scale(0.5); opacity: 0; }
    70%  { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes checkDraw {
    from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; }
  }
  @keyframes floatCard {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-6px); }
  }
  @keyframes borderGlow {
    0%,100% { box-shadow: 0 0 0 0 rgba(56,189,248,0); }
    50%      { box-shadow: 0 0 12px 3px rgba(56,189,248,0.15); }
  }
  @keyframes gradientMove {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .reg-page * { font-family: 'Sora', sans-serif; box-sizing: border-box; }

  /* Entrance animations */
  .anim-left  { animation: fadeUp 0.7s cubic-bezier(.22,.68,0,1.2) both; }
  .anim-right { animation: fadeUp 0.7s cubic-bezier(.22,.68,0,1.2) 0.12s both; }

  /* Orbs */
  .orb { position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none; }
  .orb-a { width:320px;height:320px;
    background:radial-gradient(circle,rgba(14,165,233,0.2),transparent 70%);
    top:-100px;right:-60px;
    animation: floatOrb 8s ease-in-out infinite, orbPulse 8s ease-in-out infinite; }
  .orb-b { width:240px;height:240px;
    background:radial-gradient(circle,rgba(52,211,153,0.14),transparent 70%);
    bottom:-60px;left:-40px;
    animation: floatOrb 11s ease-in-out 2s infinite reverse, orbPulse 11s ease-in-out 2s infinite; }
  .orb-c { width:160px;height:160px;
    background:radial-gradient(circle,rgba(6,182,212,0.12),transparent 70%);
    top:45%;right:30%;
    animation: floatOrb 14s ease-in-out 4s infinite, orbPulse 14s ease-in-out 4s infinite; }

  /* Scanline */
  .scanline-wrap { position:absolute;inset:0;overflow:hidden;border-radius:1.25rem;pointer-events:none;z-index:1; }
  .scanline { position:absolute;left:0;right:0;height:2px;
    background:linear-gradient(90deg,transparent,rgba(56,189,248,0.12),transparent);
    animation: scanline 5s linear infinite; }

  /* Noise */
  .noise {
    position:absolute;inset:0;border-radius:1.25rem;pointer-events:none;z-index:0;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    opacity:0.025;
  }

  /* Ripple button */
  .btn-ripple { position:relative;overflow:hidden; }
  .btn-ripple .ripple-el {
    position:absolute;border-radius:50%;
    background:rgba(255,255,255,0.35);
    width:80px;height:80px;margin-top:-40px;margin-left:-40px;
    animation: ripple 0.6s linear forwards;
    pointer-events:none;
  }

  /* Step circles */
  .step-done .step-circle {
    animation: stepPop 0.4s cubic-bezier(.22,.68,0,1.2) both;
  }
  .step-done .check-path {
    stroke-dasharray: 20;
    animation: checkDraw 0.3s ease 0.2s both;
  }

  /* Live dot */
  .live-dot { animation: dotBlink 1.4s ease-in-out infinite; }

  /* Input focus glow */
  .field-input:focus { animation: borderGlow 1.8s ease-in-out infinite; }

  /* Gradient badge */
  .grad-badge {
    background: linear-gradient(90deg,rgba(56,189,248,0.15),rgba(52,211,153,0.15));
    background-size: 200% 200%;
    animation: gradientMove 4s ease infinite;
  }

  /* Float card on left */
  .float-card { animation: floatCard 4s ease-in-out infinite; }
  .float-card-2 { animation: floatCard 4s ease-in-out 1.3s infinite; }
  .float-card-3 { animation: floatCard 4s ease-in-out 2.1s infinite; }

  /* Shimmer on badge */
  .badge-shimmer { position:relative;overflow:hidden; }
  .badge-shimmer::after {
    content:'';position:absolute;inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);
    background-size:400px 100%;
    animation:shimmer 2.6s linear infinite;
  }

  /* Form field label slide */
  .field-label { display:block;transition:color 0.2s; }

  /* Section divider label */
  .section-label {
    display:flex;align-items:center;gap:10px;margin:20px 0 14px;
  }
  .section-label span {
    font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;
    color:rgba(148,163,184,0.6);white-space:nowrap;
  }
  .section-label::before,.section-label::after {
    content:'';flex:1;height:1px;background:rgba(255,255,255,0.07);
  }
`;

/* ─── Form steps config for left panel ─── */
const STEPS = [
  { label: 'Basic info',     icon: '👤', fields: ['displayName','username','email','password'] },
  { label: 'About you',      icon: '🎓', fields: ['university','department'] },
  { label: 'Coding profiles',icon: '⚡', fields: ['codeforceHandle','leetcodeUsername'] },
];

/* ─── Benefit cards for left panel ─── */
const BENEFITS = [
  { icon: '🔔', title: 'Never miss a contest', desc: 'Smart reminders before every round', color: '#38bdf8', delay: '0.6s' },
  { icon: '📊', title: 'Track your progress', desc: 'Stats from CF, LC, AC in one place', color: '#34d399', delay: '0.75s' },
  { icon: '⚡', title: 'Live contest feed', desc: 'Real-time updates as contests start', color: '#fbbf24', delay: '0.9s' },
];

/* ─── Animated input component ─── */
function AnimInput({ label, badge, hint, validState, children, style }) {
  const [focused, setFocused] = useState(false);
  const borderColor =
    validState === 'ok'  ? 'rgba(52,211,153,0.55)' :
    validState === 'err' ? 'rgba(248,113,113,0.55)' :
    focused              ? 'rgba(56,189,248,0.55)'  : 'rgba(255,255,255,0.1)';
  const shadow =
    validState === 'ok'  ? '0 0 0 3px rgba(52,211,153,0.1)' :
    validState === 'err' ? '0 0 0 3px rgba(248,113,113,0.1)' :
    focused              ? '0 0 0 3px rgba(56,189,248,0.1)' : 'none';
  const labelColor =
    validState === 'ok'  ? '#34d399' :
    validState === 'err' ? '#f87171' :
    focused              ? '#38bdf8' : 'rgba(203,213,225,1)';

  return (
    <div style={{ position: 'relative', ...style }}>
      <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:8 }}>
        <span className="field-label text-sm" style={{ color: labelColor }}>{label}</span>
        {badge && <span style={{ fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:4,background:'rgba(56,189,248,0.12)',color:'#38bdf8',border:'1px solid rgba(56,189,248,0.2)' }}>{badge}</span>}
      </div>
      {/* underline bar */}
      <span style={{
        position:'absolute',bottom:0,left:'50%',height:2,
        width: focused ? '100%' : '0%',
        background: validState==='ok' ? 'linear-gradient(90deg,#34d399,#22d3ee)' : validState==='err' ? 'linear-gradient(90deg,#f87171,#fb923c)' : 'linear-gradient(90deg,#38bdf8,#22d3ee)',
        transition:'width 0.35s cubic-bezier(.4,0,.2,1)',
        transform:'translateX(-50%)',borderRadius:2,zIndex:3,
      }} />
      {React.cloneElement(children, {
        onFocus: (e) => { setFocused(true); children.props.onFocus?.(e); },
        onBlur:  (e) => { setFocused(false); children.props.onBlur?.(e); },
        className: `field-input w-full rounded-2xl border bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 ${children.props.className || ''}`,
        style: { borderColor, boxShadow: shadow, transition:'border-color 0.25s,box-shadow 0.25s', ...children.props.style },
      })}
      {hint && <p style={{ marginTop:4,fontSize:11,color:'rgba(100,116,139,1)' }}>{hint}</p>}
    </div>
  );
}

/* ─── Ripple button ─── */
function RippleButton({ children, ...props }) {
  const [ripples, setRipples] = useState([]);
  const add = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(r => [...r, { id, left: e.clientX - rect.left, top: e.clientY - rect.top }]);
    setTimeout(() => setRipples(r => r.filter(x => x.id !== id)), 620);
  };
  return (
    <button {...props} onMouseDown={add} className={`btn-ripple ${props.className || ''}`}>
      {ripples.map(r => <span key={r.id} className="ripple-el" style={{ left: r.left, top: r.top }} />)}
      {children}
    </button>
  );
}

/* ─── Step indicator for left panel ─── */
function StepIndicator({ currentStep }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {STEPS.map((step, i) => {
        const done    = currentStep > i;
        const active  = currentStep === i;
        return (
          <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:12,marginBottom: i < STEPS.length-1 ? 0 : 0 }}>
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center' }}>
              <div
                className={done ? 'step-done' : ''}
                style={{
                  width:32,height:32,borderRadius:'50%',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  background: done ? 'rgba(52,211,153,0.2)' : active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
                  border: done ? '1.5px solid rgba(52,211,153,0.5)' : active ? '1.5px solid rgba(56,189,248,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
                  transition:'all 0.35s ease',
                  flexShrink:0,
                }}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path className="check-path" d="M2.5 7L5.5 10L11.5 4" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span style={{ fontSize:12,fontWeight:700,color: active ? '#38bdf8' : 'rgba(148,163,184,0.5)' }}>{i+1}</span>
                )}
              </div>
              {i < STEPS.length-1 && (
                <div style={{
                  width:1.5,height:28,margin:'3px 0',
                  background: done ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.07)',
                  transition:'background 0.4s ease',
                }} />
              )}
            </div>
            <div style={{ paddingTop:4, paddingBottom: i < STEPS.length-1 ? 24 : 0 }}>
              <div style={{ fontSize:13,fontWeight:600,color: done ? '#34d399' : active ? '#e2e8f0' : 'rgba(148,163,184,0.5)', transition:'color 0.3s' }}>
                {step.icon} {step.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Compute which step we're on based on filled fields ─── */
function computeStep(form) {
  const s0 = form.displayName || form.username || form.email || form.password;
  const s1 = form.university || form.department;
  const s2 = form.codeforceHandle || form.leetcodeUsername;
  if (s2) return 3;
  if (s1) return 2;
  if (s0) return 1;
  return 0;
}

/* ─── Validation feedback ─── */
function ValidationFeedback({ field, checking, validation, touched }) {
  if (!touched[field] && !checking[field]) return null;
  if (checking[field]) return (
    <span style={{ fontSize:11,color:'#60a5fa',display:'inline-flex',alignItems:'center',gap:4,marginLeft:6 }}>
      <svg width="10" height="10" viewBox="0 0 10 10" style={{ animation:'spin 0.8s linear infinite' }}>
        <circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="16" strokeDashoffset="4" strokeLinecap="round"/>
      </svg>
      Checking…
    </span>
  );
  if (validation[field]) {
    return validation[field].available
      ? <span style={{ fontSize:11,color:'#34d399',marginLeft:6 }}>✓ {validation[field].message}</span>
      : <span style={{ fontSize:11,color:'#f87171',marginLeft:6 }}>✗ {validation[field].message}</span>;
  }
  return null;
}

/* ─── Main Register component ─── */
export default function Register() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    displayName: '', username: '', email: '', password: '',
    university: '', department: '',
    codeforceHandle: '', leetcodeUsername: '',
  });
  const [loading,    setLoading]    = useState(false);
  const [validation, setValidation] = useState({ username: null, email: null, codeforceHandle: null });
  const [checking,   setChecking]   = useState({ username: false, email: false, codeforceHandle: false });
  const [touched,    setTouched]    = useState({});

  /* Debounce helper (stable ref-free version) */
  const debounce = (func, delay) => {
    let tid;
    return (...args) => { clearTimeout(tid); tid = setTimeout(() => func(...args), delay); };
  };

  const validateUsername     = debounce(async (v) => {
    if (!v) { setValidation(p => ({...p,username:null})); setChecking(p=>({...p,username:false})); return; }
    setChecking(p=>({...p,username:true}));
    try { const r = await authAPI.validateUsername(v); setValidation(p=>({...p,username:r.data})); }
    catch(e) { console.error(e); }
    finally  { setChecking(p=>({...p,username:false})); }
  }, 600);

  const validateEmail        = debounce(async (v) => {
    if (!v) { setValidation(p=>({...p,email:null})); setChecking(p=>({...p,email:false})); return; }
    setChecking(p=>({...p,email:true}));
    try { const r = await authAPI.validateEmail(v); setValidation(p=>({...p,email:r.data})); }
    catch(e) { console.error(e); }
    finally  { setChecking(p=>({...p,email:false})); }
  }, 600);

  const validateCodeforces   = debounce(async (v) => {
    if (!v) { setValidation(p=>({...p,codeforceHandle:null})); setChecking(p=>({...p,codeforceHandle:false})); return; }
    setChecking(p=>({...p,codeforceHandle:true}));
    try { const r = await authAPI.validateCodeforces(v); setValidation(p=>({...p,codeforceHandle:r.data})); }
    catch(e) { console.error(e); }
    finally  { setChecking(p=>({...p,codeforceHandle:false})); }
  }, 600);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({...p, [name]: value}));
    if      (name === 'username')       validateUsername(value);
    else if (name === 'email')          validateEmail(value);
    else if (name === 'codeforceHandle') validateCodeforces(value);
  };
  const handleBlur = (field) => setTouched(p => ({...p, [field]: true}));

  const usernamePattern    = /^[a-z0-9_-]{3,20}$/i;
  const isEmailFormatValid = (v) => v.includes('@');
  const isFormValid = () =>
    usernamePattern.test(form.username.trim()) &&
    isEmailFormatValid(form.email.trim()) &&
    form.password.length > 0 &&
    form.university?.trim().length > 0 &&
    form.department && form.department.length > 0 &&
    validation.username?.available !== false &&
    validation.email?.available !== false &&
    (!form.codeforceHandle || validation.codeforceHandle?.available !== false);

  const submit = async (event) => {
    event.preventDefault();
    if (!isFormValid()) { toast.error('Please fix validation errors'); return; }
    try {
      setLoading(true);
      const payload = {
        ...form,
        displayName:      form.displayName.trim(),
        username:         form.username.trim(),
        email:            form.email.trim(),
        university:       form.university  || null,
        department:       form.department  || null,
        codeforceHandle:  form.codeforceHandle  || null,
        leetcodeUsername: form.leetcodeUsername  || null,
      };
      const response = await authAPI.register(payload);
      login(response.data);
      toast.success('Account created');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error?.response?.data || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = computeStep(form);

  const [totalUsers, setTotalUsers] = useState(null);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await statsAPI.get();
        if (!mounted) return;
        setTotalUsers(res.data?.totalUsers ?? null);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const formatCount = (n) => {
    if (!n && n !== 0) return null;
    if (n >= 1000000) return `${Math.round(n / 100000) / 10}M+`;
    if (n >= 1000) return `${Math.round(n / 100) / 10}K+`;
    return String(n);
  };

  /* field validState helpers */
  const vs = (field) =>
    checking[field]           ? null :
    validation[field]?.available === true  ? 'ok'  :
    validation[field]?.available === false ? 'err' : null;

  /* Progress percentage */
  const filledCount = [form.displayName,form.username,form.email,form.password,form.university,form.department,form.codeforceHandle,form.leetcodeUsername].filter(Boolean).length;
  const progressPct = Math.round((filledCount / 8) * 100);

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="reg-page relative w-full"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
          padding: '2rem 1rem',
          overflow: 'hidden',
        }}
      >
        {/* Global orbs */}
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />

        <div className="relative mx-auto" style={{ maxWidth: 1100, zIndex: 10 }}>
          <div className="grid w-full gap-8 lg:grid-cols-2 items-start">

            {/* ══ LEFT PANEL ══ */}
            <div
              className="anim-left rounded-[1.25rem] border border-white/6 bg-gradient-to-br from-[#041428]/60 via-[#071226]/50 to-[#041621]/60 p-7 shadow-xl"
              style={{ position:'relative', overflow:'hidden' }}
            >
              <div className="noise" />
              <div className="scanline-wrap"><div className="scanline" /></div>

              <div style={{ position:'relative', zIndex:3 }}>

                {/* Badge */}
                <div className="badge-shimmer inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-300"
                  style={{ animation:'fadeUp 0.5s ease 0.5s both' }}>
                  New account
                </div>

                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white lg:text-4xl"
                  style={{ animation:'fadeUp 0.55s ease 0.62s both' }}>
                  Join CodePulse
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-400"
                  style={{ animation:'fadeUp 0.55s ease 0.72s both', maxWidth:320 }}>
                  One account to track every contest, across every platform.
                </p>

                {/* Divider */}
                <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'20px 0', animation:'fadeIn 0.4s ease 0.8s both' }} />

                {/* Steps */}
                <div style={{ animation:'fadeUp 0.5s ease 0.85s both' }}>
                  <StepIndicator currentStep={currentStep} />
                </div>

                {/* Progress bar */}
                <div style={{ animation:'fadeUp 0.5s ease 0.95s both' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                    <span style={{ fontSize:11,fontWeight:600,color:'rgba(148,163,184,0.6)',letterSpacing:'0.1em',textTransform:'uppercase' }}>
                      Profile completeness
                    </span>
                    <span style={{ fontSize:12,fontWeight:700,color: progressPct===100 ? '#34d399' : '#38bdf8' }}>
                      {progressPct}%
                    </span>
                  </div>
                  <div style={{ height:5,borderRadius:99,background:'rgba(255,255,255,0.07)',overflow:'hidden' }}>
                    <div style={{
                      height:'100%',borderRadius:99,
                      background: progressPct === 100
                        ? 'linear-gradient(90deg,#34d399,#22d3ee)'
                        : 'linear-gradient(90deg,#38bdf8,#22d3ee)',
                      width:`${progressPct}%`,
                      transition:'width 0.5s cubic-bezier(.4,0,.2,1)',
                    }} />
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'20px 0', animation:'fadeIn 0.4s ease 1s both' }} />

                {/* Benefit cards */}
                <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                  {BENEFITS.map((b, i) => (
                    <div
                      key={i}
                      className={`float-card${i > 0 ? `-${i+1}` : ''}`}
                      style={{
                        display:'flex',alignItems:'center',gap:12,
                        padding:'10px 14px',borderRadius:12,
                        background:'rgba(255,255,255,0.03)',
                        border:'1px solid rgba(255,255,255,0.07)',
                        animation:`fadeUp 0.5s ease ${parseFloat(b.delay) + 0.5}s both`,
                      }}
                    >
                      <div style={{
                        width:36,height:36,borderRadius:10,flexShrink:0,
                        background:`${b.color}18`,
                        border:`1px solid ${b.color}30`,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:16,
                      }}>
                        {b.icon}
                      </div>
                      <div>
                        <div style={{ fontSize:13,fontWeight:600,color:'#e2e8f0',lineHeight:1.3 }}>{b.title}</div>
                        <div style={{ fontSize:11,color:'rgba(148,163,184,0.6)',marginTop:2 }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live users pill */}
                <div style={{
                  marginTop:16,display:'inline-flex',alignItems:'center',gap:7,
                  padding:'5px 12px',borderRadius:999,
                  background:'rgba(52,211,153,0.08)',
                  border:'1px solid rgba(52,211,153,0.18)',
                  animation:'fadeUp 0.5s ease 1.4s both',
                }}>
                  <div className="live-dot" style={{ width:7,height:7,borderRadius:'50%',background:'#34d399' }} />
                  <span style={{ fontSize:11,fontWeight:600,color:'#34d399',letterSpacing:'0.05em' }}>
                    {formatCount(totalUsers) ? `${formatCount(totalUsers)} coders already tracking` : '18,000+ coders already tracking'}
                  </span>
                </div>
              </div>

              {/* Corner glow */}
              <div style={{
                position:'absolute',bottom:0,right:0,width:140,height:140,
                background:'radial-gradient(circle at bottom right,rgba(56,189,248,0.07),transparent 70%)',
                borderRadius:'0 0 1.25rem 0',pointerEvents:'none',
              }} />
            </div>

            {/* ══ RIGHT PANEL — Form ══ */}
            <form
              onSubmit={submit}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(e); }}
              className="anim-right rounded-[1.25rem] border border-white/6 bg-white/3 p-6 shadow-xl backdrop-blur-lg"
              style={{ position:'relative', overflow:'hidden' }}
            >
              <div className="noise" />
              <div className="scanline-wrap"><div className="scanline" style={{ animationDelay:'2.5s' }} /></div>

              <div style={{ position:'relative', zIndex:3 }}>
                <h2 className="text-2xl font-semibold text-white" style={{ animation:'fadeUp 0.5s ease 0.18s both' }}>
                  Create your account
                </h2>
                <p className="mt-1 text-sm text-slate-400" style={{ animation:'fadeUp 0.5s ease 0.26s both' }}>
                  Fields marked <span style={{ color:'#38bdf8' }}>*</span> are required
                </p>

                {/* ── Section: Identity ── */}
                <div className="section-label" style={{ animation:'fadeIn 0.4s ease 0.32s both' }}>
                  <span>Identity</span>
                </div>

                {/* Full Name */}
                <AnimInput label="Full Name" style={{ animation:'fadeUp 0.45s ease 0.36s both' }}>
                  <input
                    type="text" name="displayName" value={form.displayName}
                    onChange={handleInputChange} onBlur={() => handleBlur('displayName')}
                    placeholder="John Doe (optional)"
                  />
                </AnimInput>

                {/* Username */}
                <AnimInput
                  label={<>Username <span style={{color:'#38bdf8'}}>*</span><ValidationFeedback field="username" checking={checking} validation={validation} touched={touched} /></>}
                  hint="3–20 chars · letters, numbers, _ or -"
                  validState={vs('username')}
                  style={{ marginTop:14, animation:'fadeUp 0.45s ease 0.44s both' }}
                >
                  <input
                    type="text" name="username" value={form.username}
                    onChange={handleInputChange} onBlur={() => handleBlur('username')}
                    placeholder="john_doe"
                  />
                </AnimInput>

                {/* ── Section: Account ── */}
                <div className="section-label" style={{ animation:'fadeIn 0.4s ease 0.5s both' }}>
                  <span>Account</span>
                </div>

                {/* Email */}
                <AnimInput
                  label={<>Email <span style={{color:'#38bdf8'}}>*</span><ValidationFeedback field="email" checking={checking} validation={validation} touched={touched} /></>}
                  validState={vs('email')}
                  style={{ animation:'fadeUp 0.45s ease 0.54s both' }}
                >
                  <input
                    type="email" name="email" value={form.email}
                    onChange={handleInputChange} onBlur={() => handleBlur('email')}
                    placeholder="you@example.com"
                  />
                </AnimInput>

                {/* Password */}
                <AnimInput
                  label={<>Password <span style={{color:'#38bdf8'}}>*</span></>}
                  hint="At least 6 characters"
                  style={{ marginTop:14, animation:'fadeUp 0.45s ease 0.6s both' }}
                >
                  <input
                    type="password" name="password" value={form.password}
                    onChange={handleInputChange} onBlur={() => handleBlur('password')}
                    placeholder="••••••••"
                  />
                </AnimInput>

                {/* ── Section: About you ── */}
                <div className="section-label" style={{ animation:'fadeIn 0.4s ease 0.65s both' }}>
                  <span>About you</span>
                </div>

                {/* University */}
                <AnimInput label={<>University <span style={{color:'#38bdf8'}}>*</span></>} style={{ animation:'fadeUp 0.45s ease 0.68s both' }}>
                  <input
                    type="text" name="university" value={form.university}
                    onChange={handleInputChange}
                    placeholder="Enter your university"
                  />
                </AnimInput>

                {/* Department */}
                <div style={{ marginTop:14, animation:'fadeUp 0.45s ease 0.74s both' }}>
                  <label className="field-label text-sm" style={{ color:'rgba(203,213,225,1)', display:'block', marginBottom:8 }}>
                    Department <span style={{color:'#38bdf8'}}>*</span>
                  </label>
                  <select
                    name="department" value={form.department}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-sky-400"
                    style={{ color: form.department ? '#e2e8f0' : 'rgba(100,116,139,1)', cursor:'pointer' }}
                  >
                    <option value="" disabled style={{ color:'rgba(100,116,139,1)' }}>Select department</option>
                    <option value="CSE">CSE — Computer Science</option>
                    <option value="SWE">SWE — Software Engineering</option>
                    <option value="EEE">EEE — Electrical Engineering</option>
                    <option value="ICE">ICE — Information &amp; Communication</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* ── Section: Coding Profiles ── */}
                <div className="section-label" style={{ animation:'fadeIn 0.4s ease 0.78s both' }}>
                  <span>Coding profiles</span>
                </div>

                {/* Codeforces */}
                <AnimInput
                  label={<>Codeforces Handle <ValidationFeedback field="codeforceHandle" checking={checking} validation={validation} touched={touched} /></>}
                  badge="CF"
                  validState={vs('codeforceHandle')}
                  style={{ animation:'fadeUp 0.45s ease 0.82s both' }}
                >
                  <input
                    type="text" name="codeforceHandle" value={form.codeforceHandle}
                    onChange={handleInputChange} onBlur={() => handleBlur('codeforceHandle')}
                    placeholder="Optional"
                  />
                </AnimInput>

                {/* LeetCode */}
                <AnimInput
                  label="LeetCode Username"
                  badge="LC"
                  style={{ marginTop:14, animation:'fadeUp 0.45s ease 0.88s both' }}
                >
                  <input
                    type="text" name="leetcodeUsername" value={form.leetcodeUsername}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </AnimInput>

                {/* Submit */}
                <div style={{ marginTop:24, animation:'fadeUp 0.45s ease 0.92s both' }}>
                  <RippleButton
                    type="button"
                    onClick={(e) => { if (!loading && isFormValid()) submit(e); }}
                    disabled={loading || !isFormValid()}
                    className="w-full rounded-xl px-4 py-3 font-semibold text-slate-950 transition hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: isFormValid()
                        ? 'linear-gradient(90deg,#10b981,#84cc16)'
                        : 'linear-gradient(90deg,rgba(16,185,129,0.5),rgba(132,204,22,0.5))',
                      transition:'background 0.3s ease',
                    }}
                  >
                    {loading ? (
                      <span style={{ display:'inline-flex',alignItems:'center',gap:8 }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation:'spin 0.8s linear infinite' }}>
                          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
                        </svg>
                        Creating account…
                      </span>
                    ) : (
                      <span style={{ display:'inline-flex',alignItems:'center',gap:8 }}>
                        Create account
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </RippleButton>
                </div>

                <p className="mt-4 text-center text-sm text-slate-400" style={{ animation:'fadeIn 0.4s ease 1s both' }}>
                  Already have an account?{' '}
                  <Link to="/login" className="text-sky-400 hover:text-sky-300 font-semibold" style={{ transition:'color 0.2s' }}>
                    Sign in
                  </Link>
                </p>
              </div>
            </form>

          </div>
        </div>
      </div>
    </>
  );
}