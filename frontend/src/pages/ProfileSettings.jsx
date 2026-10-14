import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import ProfileSidebar from '../components/ProfileSidebar';
import { userAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
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

const HANDLES = [
  { name: 'codeforceHandle', label: 'Codeforces', color: '#FF5A5F', prefix: 'codeforces.com/profile/' },
  { name: 'leetcodeUsername', label: 'LeetCode', color: '#FFA116', prefix: 'leetcode.com/u/' },
  { name: 'atCoderHandle', label: 'AtCoder', color: '#22D3A6', prefix: 'atcoder.jp/users/' },
  { name: 'codeChefHandle', label: 'CodeChef', color: '#C8A97E', prefix: 'codechef.com/users/' },
  { name: 'hackerRankHandle', label: 'HackerRank', color: '#2EC866', prefix: 'hackerrank.com/profile/' },
  { name: 'githubUsername', label: 'GitHub', color: '#c4b5fd', prefix: 'github.com/' },
];

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'handles', label: 'Platform handles' },
  { id: 'security', label: 'Password' },
];

const MAX_PHOTO_SIZE = 1024 * 1024;
const BIO_MAX = 280;

const formFromUser = (user) =>
  Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, user?.[key] || '']));

function initialsOf(user) {
  const source = user?.displayName || user?.username || user?.email || 'C';
  return source.split(/[\s._@-]+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

const ICONS = {
  upload: 'M12 16V4M7.5 8.5 12 4l4.5 4.5M5 20h14',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6',
  check: 'M5 13l4 4L19 7',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
};

function Glyph({ name, className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/* ─── Building blocks ─────────────────────────────────────────── */

function SettingsCard({ id, title, description, children, footer }) {
  return (
    <section id={id} className="st-card scroll-mt-36">
      <div className="st-card-body">
        <div className="st-card-intro">
          <h2 className="st-h2">{title}</h2>
          <p className="st-desc">{description}</p>
        </div>
        <div className="min-w-0 space-y-5">{children}</div>
      </div>
      {footer && <div className="st-card-footer">{footer}</div>}
    </section>
  );
}

function Field({ id, label, hint, error, children, aside }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="st-label">{label}</label>
        {aside}
      </div>
      {children}
      {error ? <p className="st-error">{error}</p> : hint ? <p className="st-hint">{hint}</p> : null}
    </div>
  );
}

function PasswordInput({ id, name, value, onChange, autoComplete, invalid }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="st-input-wrap">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        className={invalid ? 'st-input has-toggle has-error' : 'st-input has-toggle'}
      />
      <button
        type="button"
        className="st-eye"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        <Glyph name={visible ? 'eyeOff' : 'eye'} />
      </button>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(() => formFromUser(user));
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  const original = useMemo(() => formFromUser(user), [user]);
  useEffect(() => setForm(original), [original]);

  // The stored user can be stale (e.g. edited on another device) — start from the server's copy
  useEffect(() => {
    userAPI.getProfile()
      .then(({ data }) => {
        const { brainGymStats, ...fresh } = data;
        updateUser(fresh);
      })
      .catch(() => {});
  }, [updateUser]);

  const isDirty = Object.keys(EMPTY_FORM).some((key) => form[key].trim() !== original[key].trim());

  // Highlight the section currently in view
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Warn before leaving the tab with unsaved changes
  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
    if (file.size > MAX_PHOTO_SIZE) { toast.error('Photo must be 1 MB or smaller'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, profilePictureUrl: typeof reader.result === 'string' ? reader.result : '' }));
    reader.readAsDataURL(file);
  };

  const saveProfile = async (e) => {
    e?.preventDefault();
    if (!form.displayName.trim() || !form.username.trim() || !form.email.trim()) {
      toast.error('Name, username and email are required');
      return;
    }
    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => {
        const v = value.trim();
        return [key, ['displayName', 'username', 'email'].includes(key) ? v : v || null];
      }),
    );
    try {
      setSaving(true);
      const { data } = await userAPI.updateProfile(payload);
      updateUser(data);
      toast.success('Changes saved');
    } catch (err) {
      toast.error(typeof err?.response?.data === 'string' ? err.response.data : 'Could not save your changes');
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = (e) => setPasswords((p) => ({ ...p, [e.target.name]: e.target.value }));
  const tooShort = passwords.newPassword.length > 0 && passwords.newPassword.length < 6;
  const mismatch = passwords.confirmPassword.length > 0 && passwords.confirmPassword !== passwords.newPassword;
  const canChangePassword = passwords.currentPassword && passwords.newPassword.length >= 6 && !mismatch && passwords.confirmPassword;

  const changePassword = async (e) => {
    e.preventDefault();
    if (!canChangePassword) return;
    try {
      setChangingPassword(true);
      await userAPI.changePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated');
    } catch (err) {
      toast.error(typeof err?.response?.data === 'string' ? err.response.data : 'Could not change your password');
    } finally {
      setChangingPassword(false);
    }
  };

  const photo = form.profilePictureUrl.trim();
  const preview = { ...user, displayName: form.displayName, username: form.username };

  return (
    <div className="st-root">
      <style>{STYLES}</style>
      <div className="st-glow" aria-hidden="true" />

      <div className="st-wrap relative grid grid-cols-1 gap-8 py-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-14">
        <div>
          <ProfileSidebar />
        </div>

        <div className="min-w-0">
          {/* Header */}
          <p className="st-eyebrow">Settings</p>
          <h1 className="st-h1 mt-3">Account settings</h1>
          <p className="st-lead mt-3 max-w-xl">Manage how you appear on BRUHCODE, link your coding profiles and keep your account secure.</p>

          {/* In-page section tabs */}
          <nav aria-label="Settings sections" className="st-tabs">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={activeSection === s.id ? 'st-tab is-active' : 'st-tab'}
                onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <form id="profile-form" onSubmit={saveProfile} className="space-y-6" noValidate>
            {/* ── Profile ─────────────────────────── */}
            <SettingsCard id="profile" title="Profile" description="This is how other coders see you in practice rooms and on leaderboards.">
              <div className="st-avatar-row">
                <div className="st-avatar">
                  {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : initialsOf(preview)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <button type="button" className="st-btn-ghost" onClick={() => fileInputRef.current?.click()}>
                      <Glyph name="upload" /> Upload photo
                    </button>
                    {photo && (
                      <button type="button" className="st-btn-text" onClick={() => setForm((f) => ({ ...f, profilePictureUrl: '' }))}>
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="st-hint mt-2">JPG, PNG or GIF, up to 1 MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field id="displayName" label="Full name">
                  <input id="displayName" name="displayName" value={form.displayName} onChange={update} autoComplete="name" className="st-input" />
                </Field>
                <Field id="username" label="Username" hint="3–20 characters: letters, numbers, _ or -">
                  <div className="st-input-wrap">
                    <span className="st-prefix">@</span>
                    <input id="username" name="username" value={form.username} onChange={update} autoComplete="username" className="st-input has-prefix" />
                  </div>
                </Field>
              </div>
              <Field id="email" label="Email">
                <input id="email" name="email" type="email" value={form.email} onChange={update} autoComplete="email" className="st-input" />
              </Field>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field id="university" label="University">
                  <input id="university" name="university" value={form.university} onChange={update} placeholder="e.g. University of Dhaka" className="st-input" />
                </Field>
                <Field id="department" label="Department">
                  <input id="department" name="department" value={form.department} onChange={update} placeholder="e.g. Computer Science" className="st-input" />
                </Field>
              </div>
              <Field
                id="bio"
                label="Bio"
                aside={<span className={form.bio.length > BIO_MAX ? 'st-count is-over' : 'st-count'}>{form.bio.length}/{BIO_MAX}</span>}
                error={form.bio.length > BIO_MAX ? 'Keep your bio under 280 characters.' : null}
              >
                <textarea id="bio" name="bio" rows={4} value={form.bio} onChange={update} placeholder="A line or two about your competitive programming journey" className="st-input st-textarea" />
              </Field>
            </SettingsCard>

            {/* ── Handles ─────────────────────────── */}
            <SettingsCard id="handles" title="Platform handles" description="Link your accounts so your profile shows where you compete. Handles become clickable links.">
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {HANDLES.map((h) => (
                  <Field
                    key={h.name}
                    id={h.name}
                    label={<span className="inline-flex items-center gap-2"><span className="st-dot" style={{ background: h.color }} />{h.label}</span>}
                    hint={form[h.name].trim() ? `${h.prefix}${form[h.name].trim()}` : null}
                  >
                    <input id={h.name} name={h.name} value={form[h.name]} onChange={update} placeholder={`Your ${h.label} handle`} autoComplete="off" spellCheck={false} className="st-input" />
                  </Field>
                ))}
              </div>
            </SettingsCard>
          </form>

          {/* ── Password ─────────────────────────── */}
          <form onSubmit={changePassword} className="mt-6" noValidate>
            <SettingsCard
              id="security"
              title="Password"
              description="Use at least 6 characters. You'll need your current password to confirm the change."
              footer={
                <>
                  <span className="st-hint inline-flex items-center gap-2"><Glyph name="lock" /> Your password is never shown to anyone.</span>
                  <button type="submit" className="st-btn-primary" disabled={!canChangePassword || changingPassword}>
                    {changingPassword ? 'Updating…' : 'Update password'}
                  </button>
                </>
              }
            >
              <Field id="currentPassword" label="Current password">
                <PasswordInput id="currentPassword" name="currentPassword" value={passwords.currentPassword} onChange={updatePassword} autoComplete="current-password" />
              </Field>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field id="newPassword" label="New password" error={tooShort ? 'At least 6 characters.' : null}>
                  <PasswordInput id="newPassword" name="newPassword" value={passwords.newPassword} onChange={updatePassword} autoComplete="new-password" invalid={tooShort} />
                </Field>
                <Field id="confirmPassword" label="Confirm new password" error={mismatch ? "Passwords don't match." : null}>
                  <PasswordInput id="confirmPassword" name="confirmPassword" value={passwords.confirmPassword} onChange={updatePassword} autoComplete="new-password" invalid={mismatch} />
                </Field>
              </div>
            </SettingsCard>
          </form>

          {/* Sticky save bar — appears only when there are unsaved changes */}
          <div className={isDirty ? 'st-savebar is-visible' : 'st-savebar'} aria-hidden={!isDirty}>
            <span className="text-sm text-slate-300">You have unsaved changes</span>
            <div className="flex gap-2">
              <button type="button" className="st-btn-text" onClick={() => setForm(original)} tabIndex={isDirty ? 0 : -1}>Discard</button>
              <button type="submit" form="profile-form" className="st-btn-primary" disabled={saving || form.bio.length > BIO_MAX} tabIndex={isDirty ? 0 : -1}>
                {saving ? 'Saving…' : <><Glyph name="check" /> Save changes</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap');

.st-root {
  --st-line: rgba(255,255,255,0.07);
  --st-line-strong: rgba(255,255,255,0.12);
  position: relative; overflow-x: clip; min-height: 100vh;
  background: #06070c; color: #cbd5e1;
  font-family: 'DM Sans', system-ui, sans-serif;
}
.st-wrap { width: min(100% - 32px, 1240px); margin-inline: auto; padding-bottom: 120px; }
.st-glow {
  position: absolute; top: -200px; left: 25%; width: 900px; height: 520px; pointer-events: none;
  background: radial-gradient(closest-side, rgba(56,189,248,0.09), transparent),
              radial-gradient(closest-side at 80% 60%, rgba(52,211,153,0.06), transparent);
  filter: blur(30px);
}

.st-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #64748b; }
.st-h1 { font-weight: 700; color: #f8fafc; font-size: clamp(30px, 3.6vw, 42px); line-height: 1.1; letter-spacing: -0.03em; }
.st-h2 { font-weight: 600; color: #f1f5f9; font-size: 18px; letter-spacing: -0.015em; }
.st-lead { font-size: 16px; line-height: 1.6; color: #94a3b8; }
.st-desc { margin-top: 6px; font-size: 14px; line-height: 1.6; color: #7c879b; }

/* tabs */
.st-tabs {
  position: sticky; top: 84px; z-index: 5; margin: 28px 0 24px; display: flex; gap: 4px; width: fit-content; max-width: 100%;
  padding: 4px; border-radius: 14px; overflow-x: auto; scrollbar-width: none;
  background: rgba(10,12,18,0.82); border: 1px solid var(--st-line); backdrop-filter: blur(14px);
}
.st-tab { white-space: nowrap; padding: 8px 14px; border-radius: 10px; font-size: 14px; font-weight: 500; color: #94a3b8; transition: color .2s ease, background .2s ease; }
.st-tab:hover { color: #f1f5f9; }
.st-tab.is-active { color: #f0f9ff; background: linear-gradient(90deg, rgba(56,189,248,0.18), rgba(56,189,248,0.06)); box-shadow: inset 0 0 0 1px rgba(56,189,248,0.25); }

/* cards */
.st-card {
  border-radius: 22px; overflow: hidden;
  background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01));
  border: 1px solid var(--st-line);
}
.st-card-body { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; padding: 28px; }
@media (min-width: 1100px) { .st-card-body { grid-template-columns: 240px minmax(0, 1fr); gap: 40px; } }
.st-card-footer {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
  padding: 16px 28px; border-top: 1px solid var(--st-line); background: rgba(255,255,255,0.015);
}

/* fields */
.st-label { font-size: 14px; font-weight: 500; color: #cbd5e1; }
.st-hint { margin-top: 8px; font-size: 13px; color: #64748b; overflow-wrap: anywhere; }
.st-error { margin-top: 8px; font-size: 13px; color: #fca5a5; }
.st-count { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #475569; }
.st-count.is-over { color: #fca5a5; }
.st-input-wrap { position: relative; }
.st-prefix { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 15px; pointer-events: none; }
.st-input {
  width: 100%; padding: 12px 14px; border-radius: 12px; font-size: 15px; color: #f1f5f9;
  background: rgba(255,255,255,0.025); border: 1px solid var(--st-line-strong); outline: none;
  transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
}
.st-input::placeholder { color: #475569; }
.st-input:hover { border-color: rgba(255,255,255,0.2); }
.st-input:focus { border-color: rgba(56,189,248,0.6); background: rgba(56,189,248,0.03); box-shadow: 0 0 0 4px rgba(56,189,248,0.12); }
.st-input.has-error { border-color: rgba(248,113,113,0.6); }
.st-input.has-prefix { padding-left: 32px; }
.st-input.has-toggle { padding-right: 46px; }
.st-textarea { resize: vertical; min-height: 110px; line-height: 1.6; }
.st-eye { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); display: grid; place-items: center; width: 34px; height: 34px; border-radius: 9px; color: #64748b; }
.st-eye:hover { color: #e2e8f0; background: rgba(255,255,255,0.05); }
.st-dot { width: 8px; height: 8px; border-radius: 99px; }

/* avatar */
.st-avatar-row { display: flex; align-items: center; gap: 18px; }
.st-avatar {
  flex-shrink: 0; width: 72px; height: 72px; border-radius: 20px; overflow: hidden;
  display: grid; place-items: center; font-weight: 700; font-size: 24px; color: #04121c;
  background: linear-gradient(135deg, #7dd3fc, #6ee7b7);
  box-shadow: 0 12px 30px -12px rgba(56,189,248,0.6), inset 0 1px 0 rgba(255,255,255,0.5);
}

/* buttons */
.st-btn-primary {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 999px;
  font-size: 14px; font-weight: 600; color: #04121c; background: linear-gradient(100deg, #7dd3fc, #6ee7b7);
  box-shadow: 0 10px 30px -12px rgba(56,189,248,0.6), inset 0 1px 0 rgba(255,255,255,0.5);
  transition: transform .2s ease, opacity .2s ease;
}
.st-btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
.st-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
.st-btn-ghost {
  display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px; border-radius: 999px;
  font-size: 14px; font-weight: 500; color: #e2e8f0; border: 1px solid var(--st-line-strong); background: rgba(255,255,255,0.02);
  transition: border-color .2s ease, background .2s ease;
}
.st-btn-ghost:hover { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.05); }
.st-btn-text { padding: 9px 14px; border-radius: 999px; font-size: 14px; font-weight: 500; color: #94a3b8; }
.st-btn-text:hover { color: #f1f5f9; background: rgba(255,255,255,0.04); }

/* save bar */
.st-savebar {
  position: fixed; left: 50%; bottom: 24px; z-index: 40; transform: translate(-50%, 140%);
  display: flex; align-items: center; gap: 20px; padding: 10px 10px 10px 20px; border-radius: 999px;
  width: max-content; max-width: calc(100% - 32px);
  background: rgba(14,17,26,0.92); border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(16px);
  box-shadow: 0 24px 60px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(56,189,248,0.08);
  opacity: 0; pointer-events: none; transition: transform .35s cubic-bezier(.16,1,.3,1), opacity .25s ease;
}
.st-savebar.is-visible { transform: translate(-50%, 0); opacity: 1; pointer-events: auto; }
.st-savebar button { white-space: nowrap; }

@media (max-width: 640px) {
  .st-card-body { padding: 20px; }
  .st-card-footer { padding: 14px 20px; }
  .st-tabs { position: static; }
  .st-savebar { left: 16px; right: 16px; width: auto; transform: translateY(140%); justify-content: space-between; border-radius: 18px; gap: 12px; }
  .st-savebar.is-visible { transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .st-savebar, .st-input, .st-tab, .st-btn-primary { transition: none; }
}
`;
