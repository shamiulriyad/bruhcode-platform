import React from 'react';

export default function PlatformBadge({ platform }) {
  const map = {
    Codeforces: 'bg-rose-500 text-white',
    LeetCode: 'bg-amber-400 text-black',
    AtCoder: 'bg-emerald-500 text-white',
    CodeChef: 'bg-teal-500 text-white',
    GeeksforGeeks: 'bg-emerald-600 text-white',
  };
  const cls = map[platform] || 'bg-slate-500 text-white';
  return <span className={`px-2 py-1 rounded text-xs ${cls}`}>{platform}</span>;
}
