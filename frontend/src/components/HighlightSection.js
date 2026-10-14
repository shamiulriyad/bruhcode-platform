import React from 'react';

export default function HighlightSection({ contests }) {
  if (!contests || contests.length === 0) return null;
  const top = contests.slice(0, 5);
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-2">Don't Miss</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {top.map(c => (
          <div key={c.id} className="p-3 bg-slate-800 rounded">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-gray-300">{c.platform} • {new Date(c.startTime).toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
