import React, { useEffect, useMemo, useState } from 'react';
import { contestAPI } from '../api';

const platformConfig = {
  Codeforces: { accent: 'from-rose-500/20 to-rose-500/5', text: 'text-rose-300' },
  LeetCode: { accent: 'from-amber-500/20 to-amber-500/5', text: 'text-amber-300' },
  AtCoder: { accent: 'from-emerald-500/20 to-emerald-500/5', text: 'text-emerald-300' },
  CodeChef: { accent: 'from-teal-500/20 to-teal-500/5', text: 'text-teal-300' },
  GeeksforGeeks: { accent: 'from-emerald-500/20 to-emerald-500/5', text: 'text-emerald-300' },
};

export default function Platforms() {
  const [contests, setContests] = useState([]);

  useEffect(() => {
    contestAPI.getAll().then((response) => setContests(response.data)).catch(() => setContests([]));
  }, []);

  const stats = useMemo(() => Object.entries(platformConfig).map(([platform, config]) => ({
    platform,
    count: contests.filter((contest) => contest.platform === platform).length,
    ...config,
  })), [contests]);

  return (
    <div className="w-full px-4 py-8">
      <div>
        <h2 className="text-3xl font-semibold text-white">Platforms</h2>
        <p className="mt-2 text-sm text-slate-400">See which sources are currently contributing contest data.</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <div key={item.platform} className={`rounded-[2rem] border border-white/10 bg-gradient-to-br ${item.accent} p-6`}>
            <div className={`text-sm uppercase tracking-[0.3em] ${item.text}`}>{item.platform}</div>
            <div className="mt-4 text-4xl font-semibold text-white">{item.count}</div>
            <div className="mt-2 text-sm text-slate-400">contests tracked</div>
          </div>
        ))}
      </div>
    </div>
  );
}
