import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  {
    icon: '👤',
    title: 'Sign Up & Set Up Profile',
    desc: 'Create an account and add your coding profile handles — Codeforces, AtCoder, CodeChef, LeetCode, and more — so the platform can pull your stats and history.',
  },
  {
    icon: '📅',
    title: 'Track Contests in One Place',
    desc: 'Browse the unified calendar showing contests from all 5 supported platforms. Filter by platform or date, and add reminders so you never miss a round.',
  },
  {
    icon: '⚡',
    title: 'Join or Create Practice Rooms',
    desc: 'Schedule a Virtual Team Practice Room with friends to re-sit a past contest together, complete with a shared live leaderboard and per-problem discussion threads.',
  },
  {
    icon: '🧠',
    title: 'Build Logic in Brain Gym',
    desc: 'Play quick logic-building games — Complexity Guessing, Debug the Code, Logic Puzzles — between contests to sharpen core skills, and track your accuracy and streaks.',
  },
  {
    icon: '📊',
    title: 'Track Progress on Your Profile',
    desc: 'See your contest history, Brain Gym stats, badges, and overall growth over time, all in one dashboard.',
  },
];

const FAQS = [
  {
    q: 'Is it free?',
    a: 'Yes, BRUHCODE’s core features are completely free to use — contest tracking, the calendar, practice rooms, and Brain Gym all included.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'Codeforces, AtCoder, CodeChef, LeetCode, and GeeksforGeeks contests are all aggregated in real time into one unified calendar.',
  },
  {
    q: 'Do I need to link my judge accounts?',
    a: 'Linking your handles is optional but recommended — it unlocks personalized rating history and stat tracking on your profile.',
  },
  {
    q: 'Can I practice with friends?',
    a: 'Yes — create a Virtual Practice Room, invite friends with a share link, and re-sit any past contest together with a live shared leaderboard.',
  },
];

/* ─── Vertical stepper with a connecting line that "draws" on scroll ─── */
function StepperSection() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.4'],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <section ref={containerRef} className="relative mb-24">
      <div className="text-center mb-14">
        <h2 className="text-2xl font-bold text-white mb-2">The Journey</h2>
        <p className="text-sm text-slate-400">Five steps from sign-up to sharpened skills</p>
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Connecting line track */}
        <div className="absolute left-[27px] top-2 bottom-2 w-[2px] bg-white/5" aria-hidden="true" />
        {/* Animated draw-in fill */}
        <motion.div
          className="absolute left-[27px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-sky-400 via-sky-400 to-emerald-400 origin-top"
          style={{ scaleY: shouldReduceMotion ? 1 : lineScale }}
          aria-hidden="true"
        />

        <div className="flex flex-col gap-10">
          {STEPS.map((step, idx) => (
            <motion.div
              key={step.title}
              className="relative flex gap-6 pl-0"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={itemVariants}
              transition={{ delay: idx * 0.08 }}
            >
              <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full border border-sky-500/25 bg-slate-950 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(56,189,248,0.08)]">
                {step.icon}
              </div>
              <div className="pt-1 pb-2">
                <span className="font-mono text-[11px] font-black text-sky-400 tracking-widest uppercase">
                  Step {idx + 1}
                </span>
                <h3 className="text-base font-bold text-white mt-1 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-md">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Collapsible FAQ mini-section ─────────────────────────────────── */
function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section id="faq" className="mb-24 max-w-2xl mx-auto">
      <style>{`
        .hiw-faq-content {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 0.25s ease, opacity 0.2s ease;
        }
        .hiw-faq-content.is-open { grid-template-rows: 1fr; opacity: 1; }
        .hiw-faq-inner { overflow: hidden; min-height: 0; }
        .hiw-faq-chevron { transition: transform 0.25s ease; }
        .hiw-faq-chevron.is-open { transform: rotate(180deg); }
      `}</style>

      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-white mb-2">Frequently Asked Questions</h2>
        <p className="text-sm text-slate-400">Quick answers before you dive in</p>
      </div>

      <div className="flex flex-col gap-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={faq.q}
              className="rounded-xl border border-white/5 bg-slate-900/30 overflow-hidden"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
                aria-controls={`hiw-faq-panel-${idx}`}
                onClick={() => setOpenIdx(isOpen ? -1 : idx)}
              >
                <span className="text-sm font-semibold text-white">{faq.q}</span>
                <svg
                  className={`hiw-faq-chevron${isOpen ? ' is-open' : ''} w-4 h-4 text-slate-400 flex-shrink-0`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div id={`hiw-faq-panel-${idx}`} className={`hiw-faq-content${isOpen ? ' is-open' : ''}`}>
                <div className="hiw-faq-inner">
                  <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Final CTA banner ─────────────────────────────────────────────── */
function CtaBanner() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="text-center">
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/20 via-slate-900/40 to-slate-950/40 p-10 backdrop-blur-md">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
        <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Ready to get started?</h2>
        <p className="max-w-md mx-auto text-xs text-slate-400 leading-relaxed mb-6">
          Set up your profile, catch the next contest, and start training with your team today.
        </p>
        <Link
          to={isAuthenticated ? '/profile' : '/register'}
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 hover:bg-sky-400 px-8 py-3 text-sm font-bold text-slate-950 transition-colors shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.4)]"
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
        </Link>
      </div>
    </section>
  );
}

export default function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();
  const heroVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060612' }}>
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-20 text-slate-200">

        {/* Hero / Intro */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={heroVariants}
          className="text-center mb-20 flex flex-col items-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-sky-400 uppercase mb-6">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            Walkthrough
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            How BRUHCODE Works
          </h1>
          <p className="max-w-2xl text-base md:text-lg text-slate-400 leading-relaxed">
            A quick look at the full journey — from creating your account to sharpening your skills between contests.
          </p>
        </motion.section>

        <StepperSection />
        <FaqAccordion />
        <CtaBanner />

      </div>
    </div>
  );
}
