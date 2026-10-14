import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import LogoHero from '../components/LogoHero';

/* ─── Config for Platform Brand Colors ────────────────────────── */
const PLATFORM_THEMES = {
  Codeforces: { color: '#FF4D4D', bg: 'rgba(255,77,77,0.1)', border: 'rgba(255,77,77,0.2)' },
  LeetCode:   { color: '#FFA116', bg: 'rgba(255,161,22,0.1)', border: 'rgba(255,161,22,0.2)' },
  AtCoder:    { color: '#00C896', bg: 'rgba(0,200,150,0.1)',  border: 'rgba(0,200,150,0.2)' },
  CodeChef:   { color: '#A0855B', bg: 'rgba(160,133,91,0.1)', border: 'rgba(160,133,91,0.2)' },
  GeeksforGeeks: { color: '#0F9D58', bg: 'rgba(15,157,88,0.1)', border: 'rgba(15,157,88,0.2)' },
};

export default function About() {
  const shouldReduceMotion = useReducedMotion();

  // Scroll reveal variants
  const revealVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const featureCards = [
    {
      icon: '📅',
      title: 'Unified Contest Calendar',
      desc: 'All platform contest schedules normalized into a single timeline with local timezone support.',
    },
    {
      icon: '📊',
      title: 'Multi-Handle Rating Tracker',
      desc: 'Connect your Codeforces, AtCoder, and LeetCode usernames to monitor all statistics in one dashboard.',
    },
    {
      icon: '⚡',
      title: 'Virtual Team Practice Rooms',
      desc: 'Resit past rounds in real-time with friends. Shared timer, presence, private leaderboards, and anti-spoiler threads.',
    },
    {
      icon: '🔔',
      title: 'Smart Reminders',
      desc: 'Receive in-app toasts and automated email alerts 30 minutes and 5 minutes before your saved rounds start.',
    },
  ];

  const steps = [
    {
      n: '01',
      title: 'Create Account',
      desc: 'Sign up and link your competitive programming platform handles in your profile settings.',
    },
    {
      n: '02',
      title: 'Track Contests',
      desc: 'Browse upcoming rounds, add them to your calendar, and set alerts for quick access.',
    },
    {
      n: '03',
      title: 'Create Team Room',
      desc: 'Launch a practice lobby, invite friends using a share link, and select a past contest to solve.',
    },
    {
      n: '04',
      title: 'Analyze & Rematch',
      desc: 'Review team rankings on the final podium, discuss solutions in unlocked threads, and start a rematch.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#060612' }}>
    <div className="mx-auto max-w-5xl px-6 py-12 md:py-20 text-slate-200">

      {/* 1. Hero Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants}
        className="text-center mb-24 flex flex-col items-center"
      >
        <div className="mb-6">
          <LogoHero size={72} />
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-sky-400 uppercase mb-6">
          <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
          About BRUHCODE
        </span>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
          All contests. <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 italic font-medium">One place.</span>
        </h1>
        <p className="max-w-2xl text-base md:text-lg text-slate-400 leading-relaxed mb-8">
          BRUHCODE aggregates coding contests from all major competitive programming platforms into a single, real-time dashboard. Plan your calendar, track your stats, and practice with your team.
        </p>
        <div className="flex gap-4">
          <Link
            to="/"
            className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-8 py-3 text-sm font-bold text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] transition-all hover:scale-105 duration-200"
          >
            View Contests
          </Link>
        </div>
      </motion.section>

      {/* 2. Problem + Mission Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24 p-8 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900/60 to-slate-950/40 backdrop-blur-md"
      >
        <div>
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-3">The Problem</span>
          <h2 className="text-xl font-bold text-white mb-3">Scattered Competitive Calendars</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Competitive programming contests are scattered across Codeforces, LeetCode, CodeChef, AtCoder, and GeeksforGeeks. Developers are forced to constantly check multiple sites, deal with differing timezone listings, and keep manual sheets just to plan their training schedule.
          </p>
        </div>
        <div className="border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-3">The Mission</span>
          <h2 className="text-xl font-bold text-white mb-3">Unified Coordination</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            BRUHCODE unifies the entire workflow. By pulling schedules in real time, normalizing timeline offsets, and offering collaborative practice rooms with synced timers and spoiler-protected chats, we make sure the only thing standing between you and the podium is your coding skills.
          </p>
        </div>
      </motion.section>

      {/* 3. Key Features Grid */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants}
        className="mb-24"
      >
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-2">Platform Capabilities</h2>
          <p className="text-sm text-slate-400">Everything a coder needs to stay prepared and compete</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featureCards.map((feat, idx) => (
            <div
              key={idx}
              className="group p-6 rounded-xl border border-white/5 bg-slate-900/30 hover:bg-slate-900/50 hover:border-sky-500/25 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-2xl mb-4 bg-sky-500/10 border border-sky-500/20 w-12 h-12 rounded-lg flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-sky-400 transition-colors">
                {feat.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* 4. How It Works */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants}
        className="mb-24 relative"
      >
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-2">How It Works</h2>
          <p className="text-sm text-slate-400">From setup to competitive training with your team</p>
        </div>

        {/* Stepper connecting line (hidden on mobile, animated on scroll on desktop) */}
        <div className="hidden md:block absolute top-[110px] left-8 right-8 h-[2px] bg-gradient-to-r from-sky-500/30 via-emerald-500/30 to-sky-500/30 -z-10" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center md:items-start p-6 rounded-xl border border-white/5 bg-slate-900/20 text-center md:text-left"
            >
              <span className="font-mono text-xs font-black text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-full w-8 h-8 flex items-center justify-center mb-4">
                {step.n}
              </span>
              <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/5 px-6 py-2.5 text-xs font-bold text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/40 transition-all hover:scale-105"
          >
            See the Full Walkthrough →
          </Link>
        </div>
      </motion.section>

      {/* 5. Supported Platforms */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants}
        className="mb-24"
      >
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Aggregated Platforms</h2>
          <p className="text-xs text-slate-400">Aggregating real-time schedules from industry leaders</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {Object.entries(PLATFORM_THEMES).map(([name, theme]) => (
            <div
              key={name}
              style={{ borderColor: theme.border, background: theme.bg }}
              className="border px-6 py-3 rounded-lg flex items-center gap-3 transition-transform hover:scale-105"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: theme.color }} />
              <span className="text-sm font-semibold text-white">{name}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* 6. Stats Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24 text-center"
      >
        {[
          { value: '5', label: 'Supported Platforms' },
          { value: '1,250+', label: 'Lifetime Contests' },
          { value: '450+', label: 'Active Users' },
          { value: '80+', label: 'Practice Rooms Created' },
        ].map((stat, idx) => (
          <div key={idx} className="p-6 rounded-xl border border-white/5 bg-slate-900/30">
            <div className="text-3xl font-black text-white font-mono mb-2">{stat.value}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{stat.label}</div>
          </div>
        ))}
      </motion.section>

      {/* 7. Creator Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mb-24 p-8 rounded-2xl border border-white/5 bg-slate-900/30"
      >
        <div className="flex justify-center">
          {/* Avatar Placeholder */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center font-black text-2xl text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
            SR
          </div>
        </div>
        <div className="md:col-span-2 text-center md:text-left">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block mb-2">Creator Note</span>
          <h2 className="text-lg font-bold text-white mb-2">Why I built BRUHCODE</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Built by a competitive programming enthusiast who was tired of missing rounds across platforms. Managing multiple tabs, calendars, and timezone conversions got in the way of practicing. BRUHCODE was built to coordinate competitive rounds in one spot, helping teams practice together.
          </p>
          <span className="text-xs font-bold text-slate-300 block">— Shamiul Islam Riyad, Creator</span>
        </div>
      </motion.section>

      {/* 8. Tech Stack Badge Row */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants}
        className="mb-24 text-center"
      >
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">System Technology Stack</div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {['React 19', 'ASP.NET Core 10', 'SignalR Hubs', 'PostgreSQL DB', 'Entity Framework Core', 'Tailwind CSS'].map((tech) => (
            <span
              key={tech}
              className="text-xs font-semibold px-4 py-1.5 rounded-full border border-white/5 bg-slate-950/60 text-slate-300"
            >
              {tech}
            </span>
          ))}
        </div>
      </motion.section>

      {/* 9. Contact / Links */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-24"
      >
        <Link
          to="/contact"
          className="p-6 rounded-xl border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/40 text-center transition-all"
        >
          <span className="text-xl block mb-2">✉️</span>
          <h4 className="text-sm font-bold text-white mb-1">Contact Us</h4>
          <p className="text-[11px] text-slate-400">Send us a message directly</p>
        </Link>
        <a
          href="https://github.com/riyad"
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 rounded-xl border border-white/5 bg-slate-900/20 hover:bg-slate-900/40 hover:border-sky-500/20 text-center transition-all"
        >
          <span className="text-xl block mb-2">💻</span>
          <h4 className="text-sm font-bold text-white mb-1">GitHub Repository</h4>
          <p className="text-[11px] text-slate-400">Contribute, fork, or view the codebase</p>
        </a>
        <a
          href="mailto:feedback@bruhcode.com"
          className="p-6 rounded-xl border border-white/5 bg-slate-900/20 hover:bg-slate-900/40 hover:border-sky-500/20 text-center transition-all"
        >
          <span className="text-xl block mb-2">📬</span>
          <h4 className="text-sm font-bold text-white mb-1">Feedback & Support</h4>
          <p className="text-[11px] text-slate-400">Send feature requests or report bugs</p>
        </a>
        <div className="p-6 rounded-xl border border-white/5 bg-slate-900/20 hover:bg-slate-900/40 hover:border-sky-500/20 text-center transition-all cursor-pointer">
          <span className="text-xl block mb-2">💬</span>
          <h4 className="text-sm font-bold text-white mb-1">Discord Server</h4>
          <p className="text-[11px] text-slate-400">Join the CP coordinator discussion</p>
        </div>
      </motion.section>

      {/* 10. Final CTA Banner */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={revealVariants}
        className="text-center"
      >
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/20 via-slate-900/40 to-slate-950/40 p-10 backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Ready to never miss a contest again?</h2>
          <p className="max-w-md mx-auto text-xs text-slate-400 leading-relaxed mb-6">
            Join other competitive programmers and start managing your contest schedule efficiently today.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-full bg-sky-500 hover:bg-sky-400 px-8 py-3 text-sm font-bold text-slate-950 transition-colors shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.4)]"
          >
            Get Started Free
          </Link>
        </div>
      </motion.section>

    </div>
    </div>
  );
}