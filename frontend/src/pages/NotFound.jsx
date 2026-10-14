import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-160px)] w-full items-center justify-center px-4 py-12 text-center">
      <div>
        <div className="text-sm uppercase tracking-[0.4em] text-slate-500">404</div>
        <h1 className="mt-4 text-4xl font-semibold text-white">Page not found</h1>
        <p className="mt-3 text-sm text-slate-400">The route you requested does not exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950">
          Back to contests
        </Link>
      </div>
    </div>
  );
}