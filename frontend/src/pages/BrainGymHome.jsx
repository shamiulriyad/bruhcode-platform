import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { brainGymAPI } from '../api';

export default function BrainGymHome() {
  const [categories, setCategories] = useState({});
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [gamesRes, overviewRes] = await Promise.all([
        brainGymAPI.getGamesList(),
        brainGymAPI.getOverview()
      ]);
      setCategories(gamesRes.data);
      setOverview(overviewRes.data);
    } catch (err) {
      toast.error('Failed to load Brain Gym dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getIcon = (key) => {
    const icons = {
      complexity_guess: '🏋️‍♂️',
      debug_the_code: '🐛',
      logic_ladder: '🪜'
    };
    return icons[key] || '🎮';
  };

  const getPlayPath = (key) => {
    const paths = {
      complexity_guess: '/games/complexity',
      debug_the_code: '/games/debug',
      logic_ladder: '/games/ladder'
    };
    return paths[key] || '#';
  };

  // Get accent color variables by category for customized card styling
  const getCategoryStyles = (catName) => {
    const styles = {
      'Speed & Recall': { accent: '#38bdf8', bgTint: 'rgba(56,189,248,0.03)', border: 'rgba(56,189,248,0.1)' },
      'Code Reading': { accent: '#a78bfa', bgTint: 'rgba(167,139,250,0.03)', border: 'rgba(167,139,250,0.1)' },
      'Pure Logic': { accent: '#34d399', bgTint: 'rgba(52,211,153,0.03)', border: 'rgba(52,211,153,0.1)' }
    };
    return styles[catName] || { accent: '#94a3b8', bgTint: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.05)' };
  };

  const overallStats = overview?.overallStats || {
    totalGamesPlayed: 0,
    overallAccuracy: 0,
    bestStreak: 0
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (loading) {
    return <ShimmerDashboard prefersReducedMotion={prefersReducedMotion} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#060612" }}>
    <div className="max-w-6xl mx-auto px-6 py-12 text-slate-200">

      {/* Premium Header */}
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12 border-b border-white/5 pb-8"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-500/5 text-xs text-sky-400 font-semibold tracking-wider uppercase mb-3">
            🧠 Brain Gym
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Logic & Analysis <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400">Gymnasium</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 max-w-xl">
            Sharpen your algorithmic comprehension, spot code anomalies under time pressure, and track your analytical growth.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link
            to="/profile/brain-gym"
            className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all hover:scale-105"
          >
            📊 Detailed Stats
          </Link>
        </div>
      </motion.div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {[
          { label: 'Total Workouts', val: overallStats.totalGamesPlayed, icon: '🎯', color: 'text-white' },
          { label: 'Best Active Streak', val: overallStats.bestStreak, icon: '🔥', color: 'text-amber-400' },
          { label: 'Overall Accuracy', val: `${overallStats.overallAccuracy}%`, icon: '⚡', color: 'text-emerald-400' }
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md relative overflow-hidden group shadow-lg"
          >
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-6xl select-none group-hover:scale-110 transition-transform">{item.icon}</div>
            <div className={`text-3xl font-black font-mono ${item.color}`}>{item.val}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{item.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Available Modules Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]"></div>
          <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest font-mono">Available Modules</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(categories).flatMap(catName => categories[catName]).map((game) => {
            const catStyles = getCategoryStyles(game.category);
            const stats = overview?.gameStats?.find(s => s.gameKey === game.gameKey);
            const hasPlayed = !!stats;
            const path = getPlayPath(game.gameKey);

            return (
              <TiltCard
                key={game.gameKey}
                catStyles={catStyles}
                prefersReducedMotion={prefersReducedMotion}
              >
                <div className="flex flex-col justify-between h-full relative z-10">
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <motion.span
                          whileHover={prefersReducedMotion ? {} : { rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                          className="text-3xl p-2 rounded-xl bg-slate-950/60 border border-white/5 inline-block select-none"
                        >
                          {getIcon(game.gameKey)}
                        </motion.span>
                        <div>
                          <h3 className="font-bold text-lg text-white group-hover:text-sky-400 transition-colors">
                            {game.name}
                          </h3>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                            {game.category}
                          </span>
                        </div>
                      </div>
                      
                      {/* Accent pill badges */}
                      {hasPlayed ? (
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                          Active
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse shadow-sm">
                          New
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                      {game.description}
                    </p>

                    {/* Game Stats block */}
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/50 border border-white/5 mb-6 text-xs">
                      <div>
                        <div className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Accuracy</div>
                        <div className="text-sm font-black text-white font-mono mt-0.5">
                          {hasPlayed ? `${stats.accuracy}%` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">Best Streak</div>
                        <div className="text-sm font-black text-white font-mono mt-0.5">
                          {hasPlayed ? `${stats.bestStreak} correct` : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {game.isActive ? (
                      <Link
                        to={path}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 py-3 text-xs font-bold text-slate-950 shadow-md hover:shadow-lg transition-all hover:scale-[1.01]"
                      >
                        Play Game →
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="w-full rounded-xl border border-white/5 bg-white/5 py-3 text-xs font-bold text-slate-500 cursor-not-allowed"
                      >
                        Coming Soon
                      </button>
                    )}
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </div>
    </div>
  );
}

// ─── Sub-Component: 3D Parallax Tilt Card Container ───────────────
function TiltCard({ children, catStyles, prefersReducedMotion }) {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e) => {
    if (prefersReducedMotion) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Max 8 degrees tilt
    setRotateX(-y / (rect.height / 8));
    setRotateY(x / (rect.width / 8));
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        transform: prefersReducedMotion 
          ? 'none' 
          : `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        backgroundColor: catStyles.bgTint,
        borderColor: catStyles.border
      }}
      whileHover={prefersReducedMotion ? {} : { y: -4, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)' }}
      className="p-6 rounded-2xl border bg-gradient-to-br from-slate-900/80 via-slate-900/20 to-slate-950/80 hover:shadow-2xl transition-all duration-200 select-none"
    >
      {children}
    </motion.div>
  );
}

// ─── Sub-Component: Shimmer Dashboard Skeletons ─────────────────
function ShimmerDashboard({ prefersReducedMotion }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 text-slate-200 space-y-12" style={{ minHeight: "100vh", background: "#060612" }}>
      <div className="space-y-3">
        <div className="h-6 bg-white/5 rounded w-1/4 animate-pulse"></div>
        <div className="h-10 bg-white/5 rounded w-1/2 animate-pulse"></div>
        <div className="h-4 bg-white/5 rounded w-1/3 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="h-28 bg-white/5 rounded-2xl border border-white/5 animate-pulse"></div>
        <div className="h-28 bg-white/5 rounded-2xl border border-white/5 animate-pulse"></div>
        <div className="h-28 bg-white/5 rounded-2xl border border-white/5 animate-pulse"></div>
      </div>
      <div className="space-y-6">
        <div className="h-6 bg-white/5 rounded w-1/5 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-60 bg-white/5 rounded-2xl border border-white/5 animate-pulse"></div>
          <div className="h-60 bg-white/5 rounded-2xl border border-white/5 animate-pulse"></div>
          <div className="h-60 bg-white/5 rounded-2xl border border-white/5 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
