import React from 'react';

export default function StatCard({ label, value, colorClass }) {
  return (
    <div className="p-4 bg-slate-800 rounded">
      <div className="text-sm text-gray-400">{label}</div>
      <div className={`text-2xl font-bold ${colorClass || ''}`}>{value}</div>
    </div>
  );
}
