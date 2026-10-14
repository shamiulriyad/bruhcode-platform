import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProfileSidebar from '../components/ProfileSidebar';
import { userAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  displayName: '',
  username: '',
  email: '',
  university: '',
  department: '',
  bio: '',
  profilePictureUrl: '',
  codeforceHandle: '',
  leetcodeUsername: '',
  hackerRankHandle: '',
  codeChefHandle: '',
  atCoderHandle: '',
  githubUsername: '',
};

const sectionNav = [
  { id: 'profile', label: 'Profile' },
  { id: 'platforms', label: 'Platforms' },
  { id: 'security', label: 'Security' },
  { id: 'activity', label: 'Activity' },
];

/* original palette accents per platform handle */
const HANDLE_ACCENT = {
  codeforceHandle: '#f87171',
  leetcodeUsername: '#f59e0b',
  hackerRankHandle: '#34d399',
  codeChefHandle: '#fbbf24',
  atCoderHandle: '#00C896',
  githubUsername: '#a78bfa',
};

const MAX_PHOTO_SIZE = 1 * 1024 * 1024;

/* ─── easeOutCubic count-up ───────────────────────────────────── */
function useCountUp(target = 0, duration = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function getInitials(user) {
  const source = user?.displayName || user?.username || user?.email || 'CP';
  return source
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* ─── Section panel ───────────────────────────────────────────── */
function SectionCard({ id, index, eyebrow, title, description, accent = '#38bdf8', children }) {
  return (
    <section id={id} className="ed-section" style={{ '--accent': accent }}>
      <div className="ed-section__rule" />
      <div className="ed-section__head">
        <div className="ed-section__meta">
          <span className="ed-section__idx">{index}</span>
          <span className="ed-eyebrow">{eyebrow}</span>
        </div>
        <h2 className="ed-section__title">{title}</h2>
        <p className="ed-section__desc">{description}</p>
      </div>
      {children}
    </section>
  );
}

/* ─── Field ───────────────────────────────────────────────────── */
function Field({ label, name, value, onChange, placeholder, type = 'text', disabled = false, helper, textarea = false, accent = '#38bdf8' }) {
  return (
    <label className="ed-field" style={{ '--accent': accent }}>
      <span className="ed-field__label">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={5}
          className="ed-textarea"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="ed-input"
        />
      )}
      {helper ? <span className="ed-helper">{helper}</span> : null}
    </label>
  );
}

/* ─── Stat cell (count-up if numeric) ─────────────────────────── */
function StatReadout({ label, value, accent, glyph, delay = 0 }) {
  const isNum = typeof value === 'number';
  const count = useCountUp(isNum ? value : 0);
  return (
    <div className="ed-stat" style={{ '--accent': accent, animationDelay: `${delay}s` }}>
      <div className="ed-stat__head">
        <span className="ed-stat__label">{label}</span>
        <span className="ed-stat__glyph" aria-hidden>{glyph}</span>
      </div>
      <div className="ed-stat__value">{isNum ? count : value}</div>
      <div className="ed-stat__bar" />
    </div>
  );
}

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savedContests, setSavedContests] = useState([]);
  const [activeSection, setActiveSection] = useState('profile');

  useEffect(() => {
    if (!user) return;

    setForm({
      displayName: user.displayName || '',
      username: user.username || '',
      email: user.email || '',
      university: user.university || '',
      department: user.department || '',
      bio: user.bio || '',
      profilePictureUrl: user.profilePictureUrl || '',
      codeforceHandle: user.codeforceHandle || '',
      leetcodeUsername: user.leetcodeUsername || '',
      hackerRankHandle: user.hackerRankHandle || '',
      codeChefHandle: user.codeChefHandle || '',
      atCoderHandle: user.atCoderHandle || '',
      githubUsername: user.githubUsername || '',
    });
  }, [user]);

  useEffect(() => {
    const loadContests = async () => {
      try {
        const response = await userAPI.getSavedContests();
        setSavedContests(response.data || []);
      } catch (error) {
        toast.error(error?.response?.data || 'Failed to load activity');
      }
    };

    loadContests();
  }, []);

  useEffect(() => {
    const sectionIds = sectionNav.map((item) => item.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id && sectionIds.includes(visible.target.id)) {
          setActiveSection(visible.target.id);
        }
      },
      { root: null, threshold: [0.25, 0.4, 0.6] }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const platformCounts = useMemo(() => {
    return savedContests.reduce((acc, item) => {
      const platform = item.contest?.platform || item.platform || 'Unknown';
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {});
  }, [savedContests]);

  const favoritePlatform = useMemo(() => {
    const entries = Object.entries(platformCounts);
    if (!entries.length) return 'N/A';
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }, [platformCounts]);

  const totalBookmarkedContests = savedContests.length;

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoPick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      toast.error('Photo must be 1MB or smaller');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setForm((prev) => ({ ...prev, profilePictureUrl: result }));
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const saveProfile = async (event) => {
    if (event && event.preventDefault) event.preventDefault();
    try {
      setSavingProfile(true);
      const payload = {
        displayName: form.displayName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        university: form.university.trim() || null,
        department: form.department.trim() || null,
        bio: form.bio.trim() || null,
        profilePictureUrl: form.profilePictureUrl.trim() || null,
        codeforceHandle: form.codeforceHandle.trim() || null,
        leetcodeUsername: form.leetcodeUsername.trim() || null,
        hackerRankHandle: form.hackerRankHandle.trim() || null,
        codeChefHandle: form.codeChefHandle.trim() || null,
        atCoderHandle: form.atCoderHandle.trim() || null,
        githubUsername: form.githubUsername.trim() || null,
      };

      const response = await userAPI.updateProfile(payload);
      updateUser(response.data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error?.response?.data || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    try {
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        toast.error('Please fill all password fields');
        return;
      }

      setChangingPassword(true);
      await userAPI.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error?.response?.data || 'Could not change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const profilePreview = form.profilePictureUrl.trim();
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
  const todayStamp = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700;9..144,800&family=Hanken+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

        .ed-root, .ed-root * { box-sizing: border-box; }
        .ed-root {
          font-family: 'Hanken Grotesk', sans-serif;
          position: relative;
          --ink: #07071a;
          --panel: #0c0c22;
          --panel-2: #101030;
          --paper: #f1f5f9;
          --dim: #94a3b8;
          --faint: #64748b;
          --rule: rgba(255,255,255,0.08);
          --rule-2: rgba(255,255,255,0.16);
          --accent: #38bdf8;
          --gold: #10b981;
          background:
            radial-gradient(120% 80% at 100% -10%, rgba(14,165,233,0.16) 0%, transparent 55%),
            radial-gradient(110% 70% at -10% 110%, rgba(16,185,129,0.12) 0%, transparent 55%),
            var(--ink);
          color: var(--paper);
        }

        /* film grain overlay */
        .ed-grain {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.05;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes drawRule { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes frameIn { from { opacity: 0; transform: translate(8px,8px); } to { opacity: 1; transform: translate(10px,10px); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: .2; } }

        .ed-eyebrow {
          font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700;
          letter-spacing: .22em; text-transform: uppercase; color: var(--accent);
        }

        /* ── masthead bar ── */
        .ed-masthead {
          display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between;
          gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--rule-2);
          font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: .16em;
          text-transform: uppercase; color: var(--faint);
          animation: fadeUp .5s ease both;
        }
        .ed-masthead__brand { color: var(--paper); font-weight: 700; letter-spacing: .26em; }
        .ed-masthead__brand b { color: var(--accent); }
        .ed-masthead__edition { display: flex; gap: 18px; flex-wrap: wrap; }

        /* ── sticky tabs ── */
        .ed-tabs {
          position: sticky; top: 14px; z-index: 6;
          display: flex; flex-wrap: wrap; align-items: center; gap: 4px;
          padding: 8px; border-radius: 4px;
          background: rgba(7,7,26,0.82); border: 1px solid var(--rule);
          backdrop-filter: blur(14px);
          animation: fadeUp .5s ease .06s both;
        }
        .ed-tab {
          position: relative; display: inline-flex; align-items: center; gap: 9px;
          padding: 10px 16px; border-radius: 3px; font-size: 13.5px; font-weight: 600;
          border: none; background: transparent; color: var(--faint);
          cursor: pointer; transition: color .25s, background .25s;
        }
        .ed-tab:hover { color: var(--paper); background: rgba(255,255,255,0.05); }
        .ed-tab__num { font-family: 'Space Mono', monospace; font-size: 11px; opacity: .65; }
        .ed-tab--active { color: var(--paper); background: rgba(56,189,248,0.10); }
        .ed-tab--active::after {
          content: ''; position: absolute; left: 14px; right: 14px; bottom: 4px; height: 2px;
          background: var(--accent); transform-origin: left; animation: drawRule .35s ease both;
        }
        .ed-tab--active .ed-tab__num { color: var(--accent); opacity: 1; }
        .ed-back {
          margin-left: auto; display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 16px; border-radius: 3px; font-size: 12px; font-weight: 600;
          font-family: 'Space Mono', monospace; letter-spacing: .08em; text-transform: uppercase;
          color: var(--dim); text-decoration: none; border: 1px solid var(--rule);
          transition: color .25s, border-color .25s, background .25s;
        }
        .ed-back:hover { color: var(--accent); border-color: var(--accent); background: rgba(56,189,248,0.08); }

        /* ── HERO ── */
        .ed-hero { position: relative; z-index: 1; padding: 8px 0 4px; animation: fadeUp .55s ease .08s both; }
        .ed-hero__kicker {
          font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: .24em;
          text-transform: uppercase; color: var(--accent); margin-bottom: 18px;
          display: flex; align-items: center; gap: 12px;
        }
        .ed-hero__kicker::after { content: ''; flex: 1; height: 1px; background: var(--rule-2); }
        .ed-hero__top { display: grid; grid-template-columns: 1.6fr 0.9fr; gap: 40px; align-items: end; }
        .ed-hero__title {
          font-family: 'Fraunces', serif; font-weight: 600; font-size: clamp(40px, 6vw, 68px);
          line-height: 0.96; letter-spacing: -0.02em; color: var(--paper); margin: 0;
        }
        .ed-hero__title em { font-style: italic; color: var(--accent); font-weight: 500; }
        .ed-hero__sub { margin-top: 20px; font-size: 15px; line-height: 1.65; color: var(--dim); max-width: 460px; }

        .ed-id { display: flex; align-items: center; gap: 18px; justify-content: flex-end; }
        .ed-avatar-frame { position: relative; flex-shrink: 0; }
        .ed-avatar-frame::after {
          content: ''; position: absolute; inset: 0; border: 1px solid var(--accent);
          border-radius: 2px; animation: frameIn .6s ease .3s both;
        }
        .ed-avatar {
          position: relative; z-index: 1;
          width: 92px; height: 92px; border-radius: 2px; overflow: hidden;
          display: grid; place-items: center;
          font-family: 'Fraunces', serif; font-weight: 700; font-size: 34px; color: #04121a;
          background: linear-gradient(150deg, var(--gold), var(--accent));
        }
        .ed-avatar__img { width: 100%; height: 100%; background-size: cover; background-position: center; }
        .ed-id__meta { text-align: right; }
        .ed-id__name { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; color: var(--paper); }
        .ed-id__handle { font-family: 'Space Mono', monospace; font-size: 11.5px; color: var(--faint); letter-spacing: .06em; margin-top: 4px; }
        .ed-id__dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #34d399; margin-right: 6px; animation: blink 2s ease infinite; }

        /* ── stats strip ── */
        .ed-stats {
          margin-top: 38px; display: grid; grid-template-columns: repeat(4, 1fr);
          border: 1px solid var(--rule-2); border-radius: 4px; overflow: hidden;
        }
        .ed-stat {
          position: relative; padding: 20px 22px; min-height: 116px;
          border-right: 1px solid var(--rule); display: flex; flex-direction: column; justify-content: space-between;
          background: rgba(255,255,255,0.015);
          animation: fadeUp .5s ease both;
          transition: background .3s;
        }
        .ed-stat:last-child { border-right: none; }
        .ed-stat:hover { background: rgba(255,255,255,0.04); }
        .ed-stat__head { display: flex; align-items: center; justify-content: space-between; }
        .ed-stat__label { font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--faint); }
        .ed-stat__glyph { font-size: 14px; opacity: .9; color: var(--accent); }
        .ed-stat__value { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 600; color: var(--paper); letter-spacing: -.01em; line-height: 1.1; word-break: break-word; }
        .ed-stat__bar { height: 2px; width: 28px; background: var(--accent); border-radius: 2px; }

        /* ── section panels ── */
        .ed-section {
          position: relative; z-index: 1;
          border-radius: 6px; padding: 32px;
          background: var(--panel); border: 1px solid var(--rule);
          scroll-margin-top: 92px;
          animation: fadeUp .55s ease both;
        }
        .ed-section__rule { position: absolute; top: 0; left: 0; height: 3px; width: 64px; background: var(--accent); border-top-left-radius: 6px; }
        .ed-section__head { margin-bottom: 26px; max-width: 660px; }
        .ed-section__meta { display: flex; align-items: baseline; gap: 14px; margin-bottom: 14px; }
        .ed-section__idx { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 700; color: var(--gold); }
        .ed-section__title { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 600; color: var(--paper); letter-spacing: -.015em; margin: 0 0 8px; line-height: 1.1; }
        .ed-section__desc { font-size: 14.5px; line-height: 1.65; color: var(--faint); margin: 0; }

        /* ── fields ── */
        .ed-field { display: block; }
        .ed-field__label { display: block; margin-bottom: 9px; font-family: 'Space Mono', monospace; font-size: 10.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--dim); }
        .ed-input, .ed-textarea {
          width: 100%; border-radius: 3px; font-family: 'Hanken Grotesk', sans-serif;
          border: 1px solid var(--rule-2); background: rgba(255,255,255,0.03);
          padding: 13px 15px; font-size: 14.5px; color: var(--paper); outline: none; resize: vertical;
          transition: border-color .25s, box-shadow .25s, background .25s;
        }
        .ed-input::placeholder, .ed-textarea::placeholder { color: var(--faint); }
        .ed-input:focus, .ed-textarea:focus {
          border-color: var(--accent);
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent);
        }
        .ed-input:disabled, .ed-textarea:disabled { opacity: .5; cursor: not-allowed; }
        .ed-helper { display: block; margin-top: 8px; font-size: 11.5px; color: var(--faint); line-height: 1.5; }

        /* ── inner sub-panels ── */
        .ed-subcard { border-radius: 4px; border: 1px solid var(--rule); background: rgba(255,255,255,0.02); padding: 22px; }
        .ed-note { border-radius: 4px; border-left: 2px solid var(--gold); background: rgba(16,185,129,0.06); padding: 14px 16px; font-size: 13px; line-height: 1.6; color: var(--dim); }
        .ed-warn {
          display: flex; flex-direction: column; gap: 14px;
          border-radius: 4px; border: 1px solid rgba(245,158,11,0.3); background: rgba(245,158,11,0.08);
          padding: 18px; font-size: 13.5px; line-height: 1.55; color: #fcd9a3;
        }

        /* ── buttons ── */
        .ed-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 9px;
          border-radius: 3px; padding: 13px 26px; font-size: 13px; font-weight: 700;
          font-family: 'Space Mono', monospace; letter-spacing: .08em; text-transform: uppercase;
          border: none; cursor: pointer;
          transition: filter .2s, transform .2s, background .2s, color .2s, border-color .2s;
        }
        .ed-btn:disabled { opacity: .5; cursor: not-allowed; }
        .ed-btn--primary { color: #04121a; background: var(--accent); }
        .ed-btn--primary:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-2px); }
        .ed-btn--amber { color: #1a1206; background: #f59e0b; }
        .ed-btn--amber:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-2px); }
        .ed-btn--upload {
          color: var(--paper); background: transparent; border: 1px solid var(--rule-2); font-weight: 700;
        }
        .ed-btn--upload:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }

        /* ── layout helpers ── */
        .ed-grid-2 { display: grid; gap: 18px; }
        @media (min-width: 768px) { .ed-grid-2 { grid-template-columns: 1fr 1fr; } }
        .ed-grid-3 { display: grid; gap: 18px; }
        @media (min-width: 768px) { .ed-grid-3 { grid-template-columns: repeat(3, 1fr); } }
        .ed-grid-handles { display: grid; gap: 18px; }
        @media (min-width: 768px) { .ed-grid-handles { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1200px) { .ed-grid-handles { grid-template-columns: repeat(3, 1fr); } }
        .ed-profile-split { display: grid; gap: 24px; }
        @media (min-width: 1024px) { .ed-profile-split { grid-template-columns: 1.05fr 0.95fr; } }
        .ed-actions { display: flex; justify-content: flex-end; margin-top: 26px; }

        @media (max-width: 900px) {
          .ed-hero__top { grid-template-columns: 1fr; gap: 28px; }
          .ed-id { justify-content: flex-start; }
          .ed-id__meta { text-align: left; }
          .ed-stats { grid-template-columns: 1fr 1fr; }
          .ed-stat:nth-child(2) { border-right: none; }
        }
        @media (max-width: 520px) {
          .ed-stats { grid-template-columns: 1fr; }
          .ed-stat { border-right: none; border-bottom: 1px solid var(--rule); }
          .ed-section { padding: 22px; }
        }
      `}</style>

      <div className="ed-root min-h-screen">
        <div className="ed-grain" aria-hidden />

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" style={{ position: 'relative', zIndex: 1 }}>
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside>
              <ProfileSidebar />
            </aside>

            <main className="space-y-6">
              {/* masthead */}
              <div className="ed-masthead">
                <span className="ed-masthead__brand">BRUH<b>CODE</b></span>
                <span className="ed-masthead__edition">
                  <span>Account Edition</span>
                  <span>{todayStamp}</span>
                </span>
              </div>

              {/* sticky tabs */}
              <div className="ed-tabs">
                {sectionNav.map((item, i) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className={`ed-tab${isActive ? ' ed-tab--active' : ''}`}
                    >
                      <span className="ed-tab__num">{String(i + 1).padStart(2, '0')}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                <Link to="/profile" className="ed-back">← Profile</Link>
              </div>

              {/* HERO */}
              <div className="ed-hero">
                <div className="ed-hero__kicker">Settings · Public Identity</div>
                <div className="ed-hero__top">
                  <div>
                    <h1 className="ed-hero__title">Tune your <em>coding identity</em></h1>
                    <p className="ed-hero__sub">
                      Update your public details, link platform handles, manage password security, and keep your account activity visible — all in one workspace.
                    </p>
                  </div>

                  <div className="ed-id">
                    <div className="ed-id__meta">
                      <div className="ed-id__name">{user?.displayName || user?.username || 'Your name'}</div>
                      <div className="ed-id__handle"><span className="ed-id__dot" />{user?.username ? `@${user.username}` : 'active account'}</div>
                    </div>
                    <div className="ed-avatar-frame">
                      <div className="ed-avatar">
                        {profilePreview ? (
                          <div className="ed-avatar__img" style={{ backgroundImage: `url(${profilePreview})` }} aria-hidden="true" />
                        ) : (
                          getInitials(user)
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ed-stats">
                  <StatReadout label="Joined"        value={joinedDate}              accent="#a78bfa" glyph="◷" delay={0.10} />
                  <StatReadout label="Bookmarked"    value={totalBookmarkedContests} accent="#0ea5e9" glyph="◆" delay={0.16} />
                  <StatReadout label="Fav Platform"  value={favoritePlatform}        accent="#10b981" glyph="★" delay={0.22} />
                  <StatReadout label="Status"        value="Active"                  accent="#34d399" glyph="●" delay={0.28} />
                </div>
              </div>

              {/* PROFILE */}
              <SectionCard
                id="profile"
                index="01"
                eyebrow="Profile details"
                title="Your public identity"
                description="Keep your core identity and public profile information up to date. These values should stay unique where required."
                accent="#38bdf8"
              >
                <form onSubmit={saveProfile}>
                  <div className="ed-profile-split">
                    <div className="space-y-5">
                      <div className="ed-grid-2">
                        <Field label="Full Name" name="displayName" value={form.displayName} onChange={handleProfileChange} placeholder="Your full name" />
                        <Field label="Username" name="username" value={form.username} onChange={handleProfileChange} placeholder="Unique username" helper="Must be unique and 3-20 characters." />
                        <Field label="Email" name="email" value={form.email} onChange={handleProfileChange} placeholder="Unique email address" type="email" helper="Email must remain unique across accounts." />
                        <Field label="University" name="university" value={form.university} onChange={handleProfileChange} placeholder="Your university" accent="#34d399" />
                      </div>
                      <Field label="Department" name="department" value={form.department} onChange={handleProfileChange} placeholder="Department or faculty" accent="#fbbf24" />
                      <Field label="Bio" name="bio" value={form.bio} onChange={handleProfileChange} placeholder="A short bio about your coding journey" textarea helper="Write something short and professional." />
                    </div>

                    <div className="ed-subcard">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                          <div className="ed-eyebrow">Profile picture</div>
                          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, color: 'var(--paper)', marginTop: 8 }}>Avatar preview</h3>
                        </div>
                        <div style={{
                          width: 66, height: 66, borderRadius: 3, overflow: 'hidden',
                          display: 'grid', placeItems: 'center',
                          border: '1px solid var(--rule-2)',
                          background: 'linear-gradient(150deg, var(--gold), var(--accent))',
                          fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 24, color: '#04121a',
                        }}>
                          {profilePreview ? (
                            <div style={{ height: '100%', width: '100%', backgroundImage: `url(${profilePreview})`, backgroundSize: 'cover', backgroundPosition: 'center' }} aria-hidden="true" />
                          ) : (
                            getInitials(user)
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        <div>
                          <button type="button" onClick={handlePhotoPick} className="ed-btn ed-btn--upload">⬆ Upload photo</button>
                        </div>
                        <Field
                          label="Profile Picture URL"
                          name="profilePictureUrl"
                          value={form.profilePictureUrl}
                          onChange={handleProfileChange}
                          placeholder="https://..."
                          helper="Upload an image up to 1MB, or paste a direct image link."
                        />
                        <div className="ed-note">
                          Clean profile pictures make the dashboard easier to scan for teammates and recruiters.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ed-actions">
                    <button type="submit" disabled={savingProfile} className="ed-btn ed-btn--primary">
                      {savingProfile ? 'Saving profile…' : 'Save profile'}
                    </button>
                  </div>
                </form>
              </SectionCard>

              {/* PLATFORMS */}
              <SectionCard
                id="platforms"
                index="02"
                eyebrow="Platform handles"
                title="Coding platform handles"
                description="Connect the handles you use most often so your developer profile stays complete."
                accent="#10b981"
              >
                <div className="ed-grid-handles">
                  <Field label="Codeforces" name="codeforceHandle" value={form.codeforceHandle} onChange={handleProfileChange} placeholder="Codeforces handle" accent={HANDLE_ACCENT.codeforceHandle} />
                  <Field label="LeetCode" name="leetcodeUsername" value={form.leetcodeUsername} onChange={handleProfileChange} placeholder="LeetCode username" accent={HANDLE_ACCENT.leetcodeUsername} />
                  <Field label="HackerRank" name="hackerRankHandle" value={form.hackerRankHandle} onChange={handleProfileChange} placeholder="HackerRank handle" accent={HANDLE_ACCENT.hackerRankHandle} />
                  <Field label="CodeChef" name="codeChefHandle" value={form.codeChefHandle} onChange={handleProfileChange} placeholder="CodeChef handle" accent={HANDLE_ACCENT.codeChefHandle} />
                  <Field label="AtCoder" name="atCoderHandle" value={form.atCoderHandle} onChange={handleProfileChange} placeholder="AtCoder handle" accent={HANDLE_ACCENT.atCoderHandle} />
                  <Field label="GitHub" name="githubUsername" value={form.githubUsername} onChange={handleProfileChange} placeholder="GitHub username" accent={HANDLE_ACCENT.githubUsername} />
                </div>
                <div className="ed-actions">
                  <button type="button" onClick={() => saveProfile()} disabled={savingProfile} className="ed-btn ed-btn--primary">
                    {savingProfile ? 'Saving…' : 'Save platforms'}
                  </button>
                </div>
              </SectionCard>

              {/* SECURITY */}
              <SectionCard
                id="security"
                index="03"
                eyebrow="Account security"
                title="Account security"
                description="Change your password whenever needed. Keep the new password strong and unique."
                accent="#f59e0b"
              >
                <form onSubmit={changePassword}>
                  <div className="ed-grid-3">
                    <Field label="Current Password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} placeholder="Current password" type="password" accent="#f59e0b" />
                    <Field label="New Password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} placeholder="New password" type="password" accent="#f59e0b" />
                    <Field label="Confirm Password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} placeholder="Confirm password" type="password" accent="#f59e0b" />
                  </div>

                  <div className="ed-warn" style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                      <span>⚠ Use at least 6 characters. The current password is required to confirm the change.</span>
                      <button type="submit" disabled={changingPassword} className="ed-btn ed-btn--amber">
                        {changingPassword ? 'Updating…' : 'Change password'}
                      </button>
                    </div>
                  </div>
                </form>
              </SectionCard>

              {/* ACTIVITY */}
              <SectionCard
                id="activity"
                index="04"
                eyebrow="User activity"
                title="User activity"
                description="A quick snapshot of your profile history and contest habits."
                accent="#a78bfa"
              >
                <div className="ed-grid-3">
                  <StatReadout label="Joined Date" value={joinedDate} accent="#a78bfa" glyph="◷" delay={0.05} />
                  <StatReadout label="Total Bookmarked" value={totalBookmarkedContests} accent="#0ea5e9" glyph="◆" delay={0.1} />
                  <StatReadout label="Favorite Platform" value={favoritePlatform} accent="#10b981" glyph="★" delay={0.15} />
                </div>

                <div className="ed-note" style={{ marginTop: 24 }}>
                  <div className="ed-eyebrow" style={{ marginBottom: 10 }}>Activity note</div>
                  Activity is computed from your saved contests, so the dashboard stays lightweight while still giving you useful context about your engagement.
                </div>
              </SectionCard>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}