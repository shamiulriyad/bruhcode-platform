import React, { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { contestAPI } from '../api';

const PLATFORMS = {
  Codeforces: { color: '#FF4D4D', glow: 'rgba(255,77,77,0.25)', icon: 'CF' },
  LeetCode:   { color: '#FFA116', glow: 'rgba(255,161,22,0.25)', icon: 'LC' },
  AtCoder:    { color: '#00C896', glow: 'rgba(0,200,150,0.25)', icon: 'AC' },
  CodeChef:   { color: '#5B4638', glow: 'rgba(91,70,56,0.35)', icon: 'CC' },
  GeeksforGeeks: { color: '#0F9D58', glow: 'rgba(15,157,88,0.25)', icon: 'GFG' },
};

const DEFAULT_COLOR = '#818CF8';

function PlatformDot({ platform }) {
  const meta = PLATFORMS[platform];
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: meta?.color || DEFAULT_COLOR,
        boxShadow: `0 0 6px ${meta?.glow || 'rgba(129,140,248,0.4)'}`,
        flexShrink: 0,
      }}
    />
  );
}

function PlatformBadge({ platform }) {
  const meta = PLATFORMS[platform];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: meta?.color || DEFAULT_COLOR,
        background: (meta?.glow || 'rgba(129,140,248,0.12)'),
        padding: '2px 8px',
        borderRadius: 20,
        border: `1px solid ${(meta?.color || DEFAULT_COLOR)}30`,
      }}
    >
      {platform}
    </span>
  );
}

function ContestCard({ contest, index }) {
  const meta = PLATFORMS[contest.platform];
  const color = meta?.color || DEFAULT_COLOR;
  const start = new Date(contest.startTime);
  const daysLeft = Math.ceil((start - Date.now()) / 86400000);

  return (
    <div
      style={{
        position: 'relative',
        background: 'rgba(15, 15, 30, 0.6)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: '14px 16px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        animation: `fadeSlideIn 0.4s ease ${index * 0.06}s both`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.borderColor = color + '50';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 3,
        background: `linear-gradient(to bottom, ${color}, transparent)`,
        borderRadius: '16px 0 0 16px',
      }} />

      <div style={{ paddingLeft: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.35, flex: 1 }}>
            {contest.name}
          </div>
          {daysLeft >= 0 && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: daysLeft === 0 ? '#FF4D4D' : daysLeft <= 2 ? '#FFA116' : '#94a3b8',
              whiteSpace: 'nowrap',
              background: 'rgba(255,255,255,0.05)',
              padding: '2px 7px',
              borderRadius: 10,
            }}>
              {daysLeft === 0 ? 'Today' : `${daysLeft}d`}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlatformBadge platform={contest.platform} />
          <span style={{ fontSize: 11, color: '#64748b' }}>
            {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' · '}
            {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [contests, setContests] = useState([]);

  useEffect(() => {
    contestAPI.getAll()
      .then(r => setContests(r.data))
      .catch(() => setContests([]));
  }, []);

  const events = useMemo(() => contests.map(c => ({
    title: c.platform,
    start: c.startTime,
    end: new Date(new Date(c.startTime).getTime() + c.duration * 60000).toISOString(),
    backgroundColor: (PLATFORMS[c.platform]?.color || DEFAULT_COLOR) + '22',
    borderColor: PLATFORMS[c.platform]?.color || DEFAULT_COLOR,
    textColor: PLATFORMS[c.platform]?.color || DEFAULT_COLOR,
  })), [contests]);

  const upcomingContests = useMemo(() =>
    [...contests]
      .filter(c => new Date(c.startTime) >= new Date())
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 7),
    [contests]
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

        .cal-page * { box-sizing: border-box; }

        .cal-page {
          font-family: 'Space Grotesk', sans-serif;
          min-height: 100vh;
          background: #060612;
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        /* Ambient background orbs */
        .cal-page::before {
          content: '';
          position: fixed;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%);
          top: -200px;
          right: -100px;
          pointer-events: none;
        }
        .cal-page::after {
          content: '';
          position: fixed;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%);
          bottom: -150px;
          left: -100px;
          pointer-events: none;
        }

        /* Header */
        .cal-header {
          margin-bottom: 2rem;
          opacity: 0;
          animation: fadeSlideIn 0.5s ease 0.1s both;
        }

        .cal-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6366f1;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cal-eyebrow::before {
          content: '';
          display: inline-block;
          width: 20px;
          height: 1px;
          background: #6366f1;
        }

        .cal-title {
          font-size: 2.4rem;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.03em;
          margin: 0 0 6px;
          line-height: 1.1;
        }
        .cal-title span {
          background: linear-gradient(135deg, #818cf8, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .cal-subtitle {
          font-size: 14px;
          color: #475569;
          margin: 0;
        }

        /* Legend */
        .platform-legend {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 20px;
          opacity: 0;
          animation: fadeSlideIn 0.5s ease 0.25s both;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          color: #64748b;
          font-weight: 500;
          font-family: 'JetBrains Mono', monospace;
        }

        /* Layout grid */
        .cal-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: 1fr 340px;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 1024px) {
          .cal-grid { grid-template-columns: 1fr; }
        }

        /* Calendar panel */
        .cal-panel {
          background: rgba(10, 10, 25, 0.8);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 24px;
          backdrop-filter: blur(20px);
          opacity: 0;
          animation: fadeSlideIn 0.5s ease 0.3s both;
        }

        /* Sidebar */
        .cal-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
          opacity: 0;
          animation: fadeSlideIn 0.5s ease 0.4s both;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px;
          background: rgba(10,10,25,0.8);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 18px;
          backdrop-filter: blur(20px);
        }
        .sidebar-title {
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-family: 'JetBrains Mono', monospace;
        }
        .sidebar-count {
          font-size: 22px;
          font-weight: 700;
          color: #818cf8;
          font-family: 'JetBrains Mono', monospace;
        }

        .contest-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 560px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .contest-list::-webkit-scrollbar { width: 4px; }
        .contest-list::-webkit-scrollbar-track { background: transparent; }
        .contest-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        /* FullCalendar overrides */
        .fc {
          font-family: 'Space Grotesk', sans-serif !important;
        }
        .fc-theme-standard .fc-scrollgrid { border: none !important; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: rgba(255,255,255,0.05) !important; }
        .fc .fc-col-header-cell-cushion {
          color: #475569 !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          letter-spacing: 0.12em !important;
          text-transform: uppercase !important;
          font-family: 'JetBrains Mono', monospace !important;
          padding: 10px 0 !important;
          text-decoration: none !important;
        }
        .fc .fc-daygrid-day-number {
          color: #64748b !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          padding: 6px 8px !important;
          text-decoration: none !important;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background: rgba(99,102,241,0.08) !important;
        }
        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          color: #818cf8 !important;
          font-weight: 700 !important;
        }
        .fc .fc-daygrid-day:hover { background: rgba(255,255,255,0.02) !important; }
        .fc-daygrid-event {
          border-radius: 6px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          border-left-width: 3px !important;
          border-top: none !important;
          border-bottom: none !important;
          border-right: none !important;
          padding: 2px 5px !important;
          margin: 1px 2px !important;
        }
        .fc-daygrid-event .fc-event-title { font-family: 'Space Grotesk', sans-serif !important; }
        .fc-button-primary {
          background: rgba(99,102,241,0.15) !important;
          border: 1px solid rgba(99,102,241,0.3) !important;
          color: #818cf8 !important;
          border-radius: 10px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          font-family: 'Space Grotesk', sans-serif !important;
          padding: 6px 14px !important;
          transition: all 0.2s !important;
          box-shadow: none !important;
        }
        .fc-button-primary:hover {
          background: rgba(99,102,241,0.25) !important;
          border-color: rgba(99,102,241,0.5) !important;
        }
        .fc-button-primary:not(:disabled).fc-button-active,
        .fc-button-primary:not(:disabled):active {
          background: rgba(99,102,241,0.35) !important;
          border-color: #6366f1 !important;
        }
        .fc-toolbar-title {
          color: #e2e8f0 !important;
          font-size: 1.1rem !important;
          font-weight: 600 !important;
          letter-spacing: -0.02em !important;
        }
        .fc-toolbar.fc-header-toolbar { margin-bottom: 20px !important; }
        .fc-daygrid-day-events { min-height: 1.5em !important; }
        .fc-more-link {
          color: #6366f1 !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          font-family: 'JetBrains Mono', monospace !important;
        }
        .fc-popover {
          background: #0f0f1e !important;
          border: 1px solid rgba(99,102,241,0.2) !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important;
        }
        .fc-popover-header {
          background: rgba(99,102,241,0.1) !important;
          color: #818cf8 !important;
          border-radius: 11px 11px 0 0 !important;
          padding: 8px 12px !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 12px !important;
        }
        .fc-popover-body { padding: 8px !important; }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="cal-page">
        {/* Header */}
        <div className="cal-header" style={{ maxWidth: 1280, margin: '0 auto 2rem' }}>
          <div className="cal-eyebrow">Contest Tracker</div>
          <h1 className="cal-title">
            Your <span>Contest</span> Calendar
          </h1>
          <p className="cal-subtitle">Visualize upcoming contests across all platforms. Never miss a round.</p>

          {/* Platform legend */}
          <div className="platform-legend">
            {Object.entries(PLATFORMS).map(([name, meta]) => (
              <div key={name} className="legend-item">
                <PlatformDot platform={name} />
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div className="cal-grid" style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Calendar */}
          <div className="cal-panel">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              height="auto"
              events={events}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek',
              }}
              eventDisplay="block"
              dayMaxEvents={3}
            />
          </div>

          {/* Sidebar */}
          <div className="cal-sidebar">
            {/* Stats header */}
            <div className="sidebar-header">
              <div>
                <div className="sidebar-title">Upcoming</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>next contests</div>
              </div>
              <div className="sidebar-count">{upcomingContests.length}</div>
            </div>

            {/* Contest list */}
            <div className="contest-list">
              {upcomingContests.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#475569', fontSize: 13, padding: '2rem 0' }}>
                  No upcoming contests
                </div>
              ) : (
                upcomingContests.map((c, i) => (
                  <ContestCard key={c.id} contest={c} index={i} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}