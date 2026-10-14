import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { userAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    university: '',
    department: '',
    codeforceHandle: '',
    leetcodeUsername: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName || '',
        email: user.email || '',
        university: user.university || '',
        department: user.department || '',
        codeforceHandle: user.codeforceHandle || '',
        leetcodeUsername: user.leetcodeUsername || '',
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const payload = {
        displayName: form.displayName.trim(),
        university: form.university || null,
        department: form.department || null,
        codeforceHandle: form.codeforceHandle || null,
        leetcodeUsername: form.leetcodeUsername || null,
      };

      const response = await userAPI.updateProfile(payload);
      if (response.data) {
        updateUser(response.data);
        toast.success('Profile updated successfully!');
        onClose();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 shadow-xl">
        {/* Header */}
        <div className="border-b border-white/5 bg-gradient-to-r from-sky-500/10 to-emerald-500/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚙️</span>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-semibold text-sky-300 mb-2">
              📝 Display Name
            </label>
            <input
              type="text"
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-slate-500 transition focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
              placeholder="Your full name"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">
              📧 Email
            </label>
            <input
              type="email"
              value={form.email}
              disabled
              className="w-full rounded-lg bg-slate-800/50 border border-white/5 px-4 py-2.5 text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* University */}
            <div>
              <label className="block text-sm font-semibold text-emerald-300 mb-2">
                🎓 University
              </label>
              <input
                type="text"
                name="university"
                value={form.university}
                onChange={handleChange}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-slate-500 transition focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                placeholder="Your university"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-semibold text-cyan-300 mb-2">
                📚 Department
              </label>
              <input
                type="text"
                name="department"
                value={form.department}
                onChange={handleChange}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-slate-500 transition focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                placeholder="Your department"
              />
            </div>

            {/* Codeforces Handle */}
            <div>
              <label className="block text-sm font-semibold text-red-300 mb-2">
                ⚡ Codeforces Handle
              </label>
              <input
                type="text"
                name="codeforceHandle"
                value={form.codeforceHandle}
                onChange={handleChange}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-slate-500 transition focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30"
                placeholder="Your Codeforces handle"
              />
            </div>

            {/* LeetCode Username */}
            <div>
              <label className="block text-sm font-semibold text-orange-300 mb-2">
                💛 LeetCode Username
              </label>
              <input
                type="text"
                name="leetcodeUsername"
                value={form.leetcodeUsername}
                onChange={handleChange}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder-slate-500 transition focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                placeholder="Your LeetCode username"
              />
            </div>
          </div>

          {/* Info Note */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <span className="text-lg flex-shrink-0">ℹ️</span>
            <p className="text-sm text-blue-200">
              Connect your coding platform accounts to showcase your achievements and stats.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-white/5 bg-slate-900/50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-white/10 text-slate-300 font-medium transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-medium transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
