import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { contactAPI } from '../api';

const SUBJECTS = ['General Question', 'Bug Report', 'Feature Request', 'Partnership', 'Other'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Success confirmation shown in place of the form ─────────────── */
function SuccessState({ onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center text-center p-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5"
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
        className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>
      <h3 className="text-xl font-bold text-white mb-2">Message sent!</h3>
      <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
        Thanks for reaching out! We'll get back to you within 2-3 business days.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
      >
        Send another message
      </button>
    </motion.div>
  );
}

/* ─── Main contact form ────────────────────────────────────────────── */
function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success
  const [serverError, setServerError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
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
          setForm({ name: '', email: '', subject: SUBJECTS[0], message: '', website: '' });
          setStatus('idle');
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {serverError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400">
          {serverError}
        </div>
      )}

      {/* Honeypot — hidden from sighted users, real browsers leave it empty; bots often fill every field */}
      <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={update('website')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={update('name')}
            placeholder="Your name"
            className="w-full rounded-lg border border-white/10 bg-slate-900/40 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-sky-500/40 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.12),0_0_20px_rgba(56,189,248,0.08)]"
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={update('email')}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-white/10 bg-slate-900/40 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-sky-500/40 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.12),0_0_20px_rgba(56,189,248,0.08)]"
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subject</label>
        <select
          value={form.subject}
          onChange={update('subject')}
          className="w-full rounded-lg border border-white/10 bg-slate-900/40 px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-sky-500/40 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.12),0_0_20px_rgba(56,189,248,0.08)]"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s} className="bg-slate-900">{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Message</label>
        <textarea
          value={form.message}
          onChange={update('message')}
          rows={5}
          placeholder="Tell us what's on your mind..."
          className="w-full rounded-lg border border-white/10 bg-slate-900/40 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all resize-none focus:border-sky-500/40 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.12),0_0_20px_rgba(56,189,248,0.08)]"
        />
        {errors.message && <p className="mt-1.5 text-xs text-red-400">{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="self-start inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 hover:bg-sky-400 disabled:opacity-70 disabled:cursor-default px-8 py-3 text-sm font-bold text-slate-950 transition-colors shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] min-w-[140px]"
      >
        <AnimatePresence mode="wait" initial={false}>
          {status === 'loading' ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="inline-block w-4 h-4 rounded-full border-2 border-slate-950/25 border-t-slate-950 animate-spin"
            />
          ) : (
            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Send Message
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </form>
  );
}

/* ─── Side panel with alternative ways to reach out ────────────────── */
function AlternativeContactPanel() {
  return (
    <div className="flex flex-col gap-4">
      <a
        href="mailto:feedback@bruhcode.com"
        className="p-5 rounded-xl border border-white/5 bg-slate-900/20 hover:bg-slate-900/40 hover:border-sky-500/20 transition-all"
      >
        <span className="text-lg block mb-2">📬</span>
        <h4 className="text-sm font-bold text-white mb-1">Email Us</h4>
        <p className="text-xs text-slate-400">feedback@bruhcode.com</p>
      </a>

      <a
        href="https://github.com/riyad"
        target="_blank"
        rel="noopener noreferrer"
        className="p-5 rounded-xl border border-white/5 bg-slate-900/20 hover:bg-slate-900/40 hover:border-sky-500/20 transition-all"
      >
        <span className="text-lg block mb-2">💻</span>
        <h4 className="text-sm font-bold text-white mb-1">GitHub</h4>
        <p className="text-xs text-slate-400">Report bugs or contribute on the repo</p>
      </a>

      <div className="p-5 rounded-xl border border-white/5 bg-slate-900/20">
        <span className="text-lg block mb-2">⏱️</span>
        <h4 className="text-sm font-bold text-white mb-1">Response Time</h4>
        <p className="text-xs text-slate-400">We typically reply within 2-3 business days</p>
      </div>

      <div className="p-5 rounded-xl border border-white/5 bg-slate-900/10">
        <p className="text-xs text-slate-400 leading-relaxed">
          Looking for quick answers? Check{' '}
          <Link to="/how-it-works" className="text-sky-400 hover:text-sky-300 font-semibold">How It Works</Link>
          {' '}or our{' '}
          <Link to="/how-it-works#faq" className="text-sky-400 hover:text-sky-300 font-semibold">FAQ</Link>.
        </p>
      </div>
    </div>
  );
}

export default function Contact() {
  const shouldReduceMotion = useReducedMotion();
  const heroVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060612' }}>
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-20 text-slate-200">

        <motion.section
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          className="text-center mb-16 flex flex-col items-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-sky-400 uppercase mb-6">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            Contact
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Get in Touch
          </h1>
          <p className="max-w-xl text-base md:text-lg text-slate-400 leading-relaxed">
            Questions, feedback, or found a bug? We'd love to hear from you.
          </p>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="md:col-span-2 p-8 rounded-2xl border border-white/5 bg-slate-900/30">
            <ContactForm />
          </div>
          <div className="md:col-span-1">
            <AlternativeContactPanel />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
