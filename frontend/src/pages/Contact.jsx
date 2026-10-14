import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { contactAPI } from '../api';

const SUBJECTS = ['General Question', 'Bug Report', 'Feature Request', 'Partnership', 'Other'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MAX = 2000;
const REPO_URL = 'https://github.com/shamiulriyad/bruhcode-platform';
const EMPTY_FORM = { name: '', email: '', subject: SUBJECTS[0], message: '', website: '' };

const ICONS = {
  github: 'M9 19c-4 1.4-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21',
  book: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H19v14H5.5A1.5 1.5 0 0 0 4 19.5v-14ZM4 19.5A1.5 1.5 0 0 0 5.5 21H19v-3',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'M5 13l4 4L19 7',
};

function Glyph({ name, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/* ─── Success confirmation shown in place of the form ─────────────── */
function SuccessState({ onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex min-h-[460px] flex-col items-center justify-center text-center"
      role="status"
    >
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
        className="ct-success-icon"
      >
        <Glyph name="check" className="h-8 w-8" />
      </motion.span>
      <h2 className="ct-h2 mt-7">Message sent</h2>
      <p className="ct-body mt-3 max-w-sm">
        Thanks for reaching out. We&apos;ll reply to your email within 2–3 business days.
      </p>
      <button type="button" onClick={onReset} className="ct-link mt-8">
        Send another message
      </button>
    </motion.div>
  );
}

/* ─── Main contact form ────────────────────────────────────────────── */
function ContactForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success
  const [serverError, setServerError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Please tell us your name.';
    if (!form.email.trim() || !EMAIL_RE.test(form.email)) next.email = 'Enter a valid email address.';
    if (form.message.trim().length < 10) next.message = 'Message must be at least 10 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (status === 'loading') return;
    if (!validate()) return;

    setStatus('loading');
    try {
      await contactAPI.submit(form);
      setStatus('success');
    } catch (err) {
      setStatus('idle');
      setServerError(err?.response?.data?.error || 'Something went wrong sending your message. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <SuccessState
        onReset={() => {
          setForm(EMPTY_FORM);
          setErrors({});
          setStatus('idle');
        }}
      />
    );
  }

  const fieldProps = (name) => ({
    id: `contact-${name}`,
    value: form[name],
    onChange: update(name),
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `contact-${name}-error` : undefined,
    className: errors[name] ? 'ct-input has-error' : 'ct-input',
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h2 className="ct-h2">Send a message</h2>
        <p className="ct-body-sm mt-2">All fields are required.</p>
      </div>

      {serverError && (
        <div role="alert" className="ct-alert">{serverError}</div>
      )}

      {/* Honeypot — hidden from people, real browsers leave it empty; bots often fill every field */}
      <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={update('website')} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="ct-label">Name</label>
          <input type="text" autoComplete="name" placeholder="Your name" {...fieldProps('name')} />
          {errors.name && <p id="contact-name-error" className="ct-error">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="contact-email" className="ct-label">Email</label>
          <input type="email" autoComplete="email" placeholder="you@example.com" {...fieldProps('email')} />
          {errors.email && <p id="contact-email-error" className="ct-error">{errors.email}</p>}
        </div>
      </div>

      <fieldset>
        <legend className="ct-label">Topic</legend>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <label key={s} className={form.subject === s ? 'ct-pill is-active' : 'ct-pill'}>
              <input
                type="radio"
                name="subject"
                value={s}
                checked={form.subject === s}
                onChange={update('subject')}
                className="sr-only"
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="contact-message" className="ct-label">Message</label>
          <span className="ct-mono text-xs text-slate-600">{form.message.length}/{MESSAGE_MAX}</span>
        </div>
        <textarea rows={6} maxLength={MESSAGE_MAX} placeholder="Tell us what's on your mind…" {...fieldProps('message')} />
        {errors.message && <p id="contact-message-error" className="ct-error">{errors.message}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <p className="ct-body-sm max-w-xs">
          We only use your email to reply. See our{' '}
          <Link to="/privacy-policy" className="text-sky-300 hover:text-sky-200">privacy policy</Link>.
        </p>
        <button type="submit" disabled={status === 'loading'} className="ct-btn-primary">
          <AnimatePresence mode="wait" initial={false}>
            {status === 'loading' ? (
              <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-950/25 border-t-slate-950" />
                Sending…
              </motion.span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                Send message <Glyph name="arrow" className="h-4 w-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </form>
  );
}

/* ─── Other ways to get help ───────────────────────────────────────── */
const CHANNELS = [
  {
    icon: 'github',
    title: 'Report a bug on GitHub',
    text: 'Open an issue with steps to reproduce — the fastest way to get a bug fixed.',
    href: `${REPO_URL}/issues`,
    external: true,
  },
  {
    icon: 'book',
    title: 'Read the FAQ',
    text: 'Answers to common questions about contests, rooms and Brain Gym.',
    to: '/how-it-works#faq',
  },
];

export default function Contact() {
  const reduce = useReducedMotion();
  const enter = (delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
  });

  return (
    <div className="ct-root">
      <style>{STYLES}</style>
      <div className="ct-grid-bg" aria-hidden="true" />

      <div className="ct-wrap relative grid grid-cols-1 gap-14 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:py-28">
        <motion.div {...enter()}>
          <p className="ct-eyebrow"><span className="ct-dot" /> Contact</p>
          <h1 className="ct-display mt-6">
            Let&apos;s talk.
          </h1>
          <p className="ct-lead mt-6 max-w-md">
            Questions, feedback or a bug to report? Send us a message — a real person reads every one.
          </p>

          <div className="ct-response mt-10">
            <Glyph name="clock" className="h-5 w-5 text-emerald-300" />
            <span>We usually reply within <strong className="font-semibold text-slate-100">2–3 business days</strong>.</span>
          </div>

          <ul className="mt-10 grid gap-3">
            {CHANNELS.map((c) => {
              const inner = (
                <>
                  <span className="ct-channel-icon"><Glyph name={c.icon} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-100">{c.title}</span>
                    <span className="ct-body-sm mt-1 block">{c.text}</span>
                  </span>
                  <Glyph name="arrow" className="ct-channel-arrow h-4 w-4" />
                </>
              );
              return (
                <li key={c.title}>
                  {c.external ? (
                    <a href={c.href} target="_blank" rel="noopener noreferrer" className="ct-channel">{inner}</a>
                  ) : (
                    <Link to={c.to} className="ct-channel">{inner}</Link>
                  )}
                </li>
              );
            })}
          </ul>
        </motion.div>

        <motion.div {...enter(0.1)} className="ct-card">
          <div className="ct-card-inner">
            <ContactForm />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────── */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

.ct-root {
  --ct-line: rgba(255,255,255,0.07);
  --ct-line-strong: rgba(255,255,255,0.12);
  position: relative; overflow: hidden; min-height: 100vh;
  background: #06070c; color: #cbd5e1;
  font-family: 'DM Sans', system-ui, sans-serif;
}
.ct-wrap { width: min(100% - 32px, 1160px); margin-inline: auto; }
.ct-grid-bg {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(var(--ct-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--ct-line) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 70% 55% at 30% 20%, #000 25%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 70% 55% at 30% 20%, #000 25%, transparent 75%);
}
.ct-grid-bg::after {
  content: ''; position: absolute; inset: 0 30% auto 0; height: 60%;
  background: radial-gradient(closest-side, rgba(56,189,248,0.13), transparent);
  filter: blur(24px);
}

.ct-eyebrow {
  display: flex; align-items: center; gap: 10px;
  font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.22em;
  text-transform: uppercase; color: #7dd3fc;
}
.ct-dot { width: 6px; height: 6px; border-radius: 99px; background: #34d399; box-shadow: 0 0 12px #34d399; }
.ct-display { font-weight: 700; color: #f8fafc; font-size: clamp(42px, 5.4vw, 68px); line-height: 1.04; letter-spacing: -0.025em; }
.ct-h2 { font-weight: 600; color: #f1f5f9; font-size: 22px; letter-spacing: -0.02em; }
.ct-lead { font-size: 18px; line-height: 1.7; color: #94a3b8; }
.ct-body { font-size: 16px; line-height: 1.7; color: #94a3b8; }
.ct-body-sm { font-size: 14px; line-height: 1.6; color: #7c879b; }
.ct-mono { font-family: 'JetBrains Mono', monospace; }

.ct-response { display: inline-flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; border: 1px solid var(--ct-line); background: rgba(255,255,255,0.02); font-size: 15px; color: #94a3b8; }

.ct-channel {
  display: flex; align-items: center; gap: 16px; padding: 18px; border-radius: 18px;
  border: 1px solid var(--ct-line); background: rgba(255,255,255,0.015);
  transition: border-color .2s ease, background .2s ease;
}
.ct-channel:hover { border-color: var(--ct-line-strong); background: rgba(255,255,255,0.035); }
.ct-channel-icon { display: grid; place-items: center; flex-shrink: 0; width: 44px; height: 44px; border-radius: 14px; color: #7dd3fc; background: rgba(56,189,248,0.08); border: 1px solid rgba(56,189,248,0.18); }
.ct-channel-arrow { color: #475569; transition: transform .2s ease, color .2s ease; }
.ct-channel:hover .ct-channel-arrow { transform: translateX(3px); color: #7dd3fc; }

.ct-card { position: relative; align-self: start; padding: 1px; border-radius: 28px; background: linear-gradient(140deg, rgba(56,189,248,0.4), rgba(255,255,255,0.06) 35%, rgba(255,255,255,0.04) 70%, rgba(52,211,153,0.35)); box-shadow: 0 40px 120px -50px rgba(56,189,248,0.4); }
.ct-card-inner { border-radius: 27px; padding: clamp(24px, 4vw, 44px); background: #090b12; }

.ct-label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #cbd5e1; }
.ct-input {
  width: 100%; padding: 13px 16px; border-radius: 12px; font-size: 15px; color: #f1f5f9;
  background: rgba(255,255,255,0.025); border: 1px solid var(--ct-line-strong); outline: none;
  transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
}
textarea.ct-input { resize: vertical; min-height: 150px; line-height: 1.6; }
.ct-input::placeholder { color: #475569; }
.ct-input:hover { border-color: rgba(255,255,255,0.2); }
.ct-input:focus { border-color: rgba(56,189,248,0.6); background: rgba(56,189,248,0.03); box-shadow: 0 0 0 4px rgba(56,189,248,0.12); }
.ct-input.has-error { border-color: rgba(248,113,113,0.6); }
.ct-error { margin-top: 8px; font-size: 13px; color: #fca5a5; }
.ct-alert { padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(248,113,113,0.3); background: rgba(248,113,113,0.06); font-size: 14px; color: #fca5a5; }

.ct-pill {
  cursor: pointer; padding: 9px 14px; border-radius: 999px; font-size: 14px; color: #94a3b8;
  border: 1px solid var(--ct-line-strong); background: rgba(255,255,255,0.02);
  transition: border-color .2s ease, color .2s ease, background .2s ease;
}
.ct-pill:hover { color: #e2e8f0; border-color: rgba(255,255,255,0.22); }
.ct-pill.is-active { color: #e0f2fe; border-color: rgba(56,189,248,0.55); background: rgba(56,189,248,0.1); }
.ct-pill:focus-within { box-shadow: 0 0 0 3px rgba(56,189,248,0.25); }

.ct-btn-primary {
  display: inline-flex; align-items: center; justify-content: center; min-width: 170px;
  padding: 14px 24px; border-radius: 999px; font-weight: 600; font-size: 15px;
  color: #04121c; background: linear-gradient(100deg, #7dd3fc, #6ee7b7);
  box-shadow: 0 10px 40px -10px rgba(56,189,248,0.55), inset 0 1px 0 rgba(255,255,255,0.5);
  transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
}
.ct-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 16px 50px -12px rgba(56,189,248,0.7), inset 0 1px 0 rgba(255,255,255,0.5); }
.ct-btn-primary:disabled { opacity: 0.75; cursor: default; }
.ct-link { font-weight: 500; color: #7dd3fc; }
.ct-link:hover { color: #bae6fd; }

.ct-success-icon { display: grid; place-items: center; width: 72px; height: 72px; border-radius: 99px; color: #6ee7b7; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.35); box-shadow: 0 0 40px -6px rgba(52,211,153,0.45); }

@media (prefers-reduced-motion: reduce) {
  .ct-channel, .ct-channel-arrow, .ct-btn-primary, .ct-input, .ct-pill { transition: none; }
}
`;
