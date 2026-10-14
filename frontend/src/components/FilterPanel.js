import React from 'react';

export default function FilterPanel({ filters, setFilters, platforms }) {
  return (
    <div className="p-3 bg-slate-900 rounded mb-4 flex gap-3 items-center">
      <select value={filters.platform} onChange={e => setFilters(f => ({...f, platform: e.target.value}))} className="p-2 bg-slate-800 rounded">
        <option value="">All Platforms</option>
        {platforms.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <input type="date" value={filters.date || ''} onChange={e => setFilters(f => ({...f, date: e.target.value}))} className="p-2 bg-slate-800 rounded" />
    </div>
  );
}
