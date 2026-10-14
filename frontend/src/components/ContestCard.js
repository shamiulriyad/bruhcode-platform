import React from 'react';
import CountdownTimer from './CountdownTimer';
import { addToCalendar } from '../utils/calendar';

const platformColor = (p) => {
  switch ((p || '').toLowerCase()) {
    case 'codeforces': return 'bg-rose-500'; // coral/red
    case 'leetcode': return 'bg-amber-400'; // amber
    case 'atcoder': return 'bg-emerald-500'; // green
    case 'codechef': return 'bg-teal-500'; // teal
    case 'geeksforgeeks': return 'bg-emerald-600'; // green
    default: return 'bg-slate-500';
  }
};

export default function ContestCard({ contest, onBookmark, actionLabel = 'Bookmark', actionTone = 'primary', compact = false }) {
  const startLocal = new Date(contest.startTime).toLocaleString();
  const pill = platformColor(contest.platform);
  return (
    <div className={`flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/30 transition hover:-translate-y-0.5 hover:border-sky-400/30 sm:flex-row sm:items-start sm:justify-between ${compact ? 'sm:gap-3' : ''}`}>
      <div className="flex min-w-0 gap-3">
        <div className={`${pill} w-2.5 rounded-md`} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="text-base font-semibold text-white sm:text-lg">{contest.name}</h3>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/90">{contest.platform}</span>
          </div>
          <div className="mt-1 text-sm text-slate-300">{startLocal}</div>
          <div className="mt-2"><CountdownTimer start={contest.startTime} /></div>
        </div>
      </div>
      <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
        <a href={contest.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-sky-400 hover:text-sky-300">Go</a>
        <div className="flex gap-2">
          <button onClick={() => addToCalendar({ id: contest.id, name: contest.name, start: new Date(contest.startTime).toISOString(), end: new Date(new Date(contest.startTime).getTime() + contest.duration * 60000).toISOString(), url: contest.url })} className="rounded-full px-3 py-1.5 text-sm font-medium bg-white/5 text-white">+ Cal</button>
          <button
            onClick={() => onBookmark(contest.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${actionTone === 'danger' ? 'bg-rose-500 text-white' : 'bg-sky-500 text-slate-950'}`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
