import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { contestAPI, userAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { addToCalendar } from '../utils/calendar';
import { REMINDER_LEAD_MINUTES, disableReminders, enableReminders, useRemindersEnabled } from '../utils/reminders';

/* ─── Platform config ──────────────────────────────────────────── */
const PLATFORMS = {
  codeforces: { name: "Codeforces", short: "CF", color: "#FF4D4D", glow: "rgba(255,77,77,0.15)",  bg: "rgba(255,77,77,0.08)",  border: "rgba(255,77,77,0.2)"  },
  leetcode:   { name: "LeetCode",   short: "LC", color: "#FFA116", glow: "rgba(255,161,22,0.15)", bg: "rgba(255,161,22,0.08)", border: "rgba(255,161,22,0.2)" },
  atcoder:    { name: "AtCoder",    short: "AC", color: "#00C896", glow: "rgba(0,200,150,0.15)",  bg: "rgba(0,200,150,0.08)",  border: "rgba(0,200,150,0.2)"  },
  codechef:   { name: "CodeChef",   short: "CC", color: "#A0855B", glow: "rgba(160,133,91,0.15)", bg: "rgba(160,133,91,0.08)", border: "rgba(160,133,91,0.2)" },
  geeksforgeeks: { name: "GeeksforGeeks", short: "GFG", color: "#0F9D58", glow: "rgba(15,157,88,0.15)",  bg: "rgba(15,157,88,0.08)",  border: "rgba(15,157,88,0.2)"  },
};
const DEFAULT_P = { name: "Unknown", short: "??", color: "#818cf8", glow: "rgba(129,140,248,0.15)", bg: "rgba(129,140,248,0.08)", border: "rgba(129,140,248,0.2)" };

const FILTER_TIME = ["All", "Today", "This week", "This month"];
const FILTER_PLAT = ["All", ...Object.keys(PLATFORMS)];

/* ─── Transform ────────────────────────────────────────────────── */
const transformContest = (contest) => {
  const startTime = new Date(contest.startTime).getTime();
  const endTime = startTime + contest.duration * 60 * 1000;
  const now = Date.now();
  let status = "upcoming";
  if (startTime <= now && endTime > now) status = "live";
  else if (endTime <= now) status = "ended";
  else if (startTime - now < 2 * 3600000) status = "soon";
  const durationHours = contest.duration / 60;
  const durationStr = durationHours < 24 ? `${durationHours.toFixed(1)}h` : `${(durationHours / 24).toFixed(1)}d`;
  return {
    id: contest.id, name: contest.name,
    platform: contest.platform.toLowerCase(),
    start: startTime, end: endTime,
    duration: durationStr,
    status, url: contest.url,
  };
};

/* ─── Group contests by date ───────────────────────────────────── */
const groupByDate = (contests) => {
  const groups = {};
  contests.forEach(c => {
    const d = new Date(c.start);
    const today = new Date();
    const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);

    const isSameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    let label;
    if (isSameDay(d, today)) {
      label = "Today · " + d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } else if (isSameDay(d, tomorrow)) {
      label = "Tomorrow · " + d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } else {
      label = d.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
    }

    const key = d.toDateString();
    if (!groups[key]) groups[key] = { label, timestamp: d.getTime(), contests: [] };
    groups[key].contests.push(c);
  });

  return Object.values(groups).sort((a, b) => a.timestamp - b.timestamp);
};

/* ─── Countdown hook ───────────────────────────────────────────── */
function useCountdown(targetTime) {
  const [timeLeft, setTimeLeft] = useState({ hours: "00", minutes: "00", seconds: "00" });
  useEffect(() => {
    const calc = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: "00", minutes: "00", seconds: "00" });
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [targetTime]);
  return timeLeft;
}


/* ─── Countdown badge ──────────────────────────────────────────── */
function CountdownBadge({ time }) {
  const t = useCountdown(time);

  const unitBox = (value, label) => (
    <div style={{
      minWidth: 42,
      padding: "6px 7px 5px",
      borderRadius: 9,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 1,
    }}>
      <span style={{
        fontSize: 17,
        lineHeight: 1,
        color: "#f1f5f9",
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.01em",
        fontVariantNumeric: "tabular-nums",
      }}>{String(Number(value))}</span>
      <span style={{
        fontSize: 7,
        color: "#94a3b8",
        fontWeight: 700,
        letterSpacing: "0.14em",
        fontFamily: "'JetBrains Mono', monospace",
      }}>{label}</span>
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {unitBox(t.hours, "HRS")}
      <span style={{ color: "rgba(255,255,255,0.38)", fontWeight: 700, fontSize: 14, lineHeight: 1 }}>:</span>
      {unitBox(t.minutes, "MIN")}
      <span style={{ color: "rgba(255,255,255,0.38)", fontWeight: 700, fontSize: 14, lineHeight: 1 }}>:</span>
      {unitBox(t.seconds, "SEC")}
    </div>
  );
}

/* ─── Status chip ──────────────────────────────────────────────── */
function StatusChip({ status }) {
  const cfg = {
    live:     { label: "● LIVE",     color: "#FF4D4D", bg: "rgba(255,77,77,0.1)",    border: "rgba(255,77,77,0.25)"    },
    soon:     { label: "◎ SOON",     color: "#FFA116", bg: "rgba(255,161,22,0.1)",   border: "rgba(255,161,22,0.25)"   },
    upcoming: { label: "○ UPCOMING", color: "#818cf8", bg: "rgba(129,140,248,0.08)", border: "rgba(129,140,248,0.2)"   },
    ended:    { label: "✕ ENDED",    color: "#475569", bg: "rgba(71,85,105,0.08)",   border: "rgba(71,85,105,0.2)"     },
  }[status] || { label: status, color: "#64748b", bg: "transparent", border: "rgba(255,255,255,0.1)" };

  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 1.4,
      padding: "3px 8px", borderRadius: 5,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      fontFamily: "'JetBrains Mono', monospace",
    }}>{cfg.label}</span>
  );
}

/* ─── Contest card ─────────────────────────────────────────────── */
function ContestCard({ contest, onSave, index = 0 }) {
  const p = PLATFORMS[contest.platform] || DEFAULT_P;
  const startDateObj = new Date(contest.start);
  const endDateObj = new Date(contest.end);
  const startTime24 = startDateObj.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const endTime12 = endDateObj.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
  const durationHours = Math.max(1, Math.round((contest.end - contest.start) / 3600000));
  const tzOffsetMin = -startDateObj.getTimezoneOffset();
  const tzSign = tzOffsetMin >= 0 ? "+" : "-";
  const tzAbs = Math.abs(tzOffsetMin);
  const tzHours = Math.floor(tzAbs / 60);
  const tzMins = tzAbs % 60;
  const tzText = `UTC${tzSign}${tzHours}${tzMins ? `:${String(tzMins).padStart(2, "0")}` : ""}`;
  const localDateLine = startDateObj.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "short", year: "numeric",
  });
  const domain = (() => {
    try {
      return new URL(contest.url).hostname.replace(/^www\./, "");
    } catch {
      return contest.url;
    }
  })();

  return (
    <div
      style={{
        position: "relative",
        background: "linear-gradient(180deg, rgba(45,45,45,0.48) 0%, rgba(30,30,30,0.42) 100%)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 14,
        padding: "0",
        display: "flex", flexDirection: "column", gap: 0,
        backdropFilter: "blur(8px)",
        transition: "border-color 0.2s, transform 0.2s",
        animation: `fadeUp 0.4s ease ${index * 0.04}s both`,
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.32)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{
        padding: "12px 14px 10px",
        minHeight: 118,
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: p.color,
            background: `${p.color}22`,
            padding: "4px 11px",
            borderRadius: 7,
            border: `1px solid ${p.color}55`,
            fontFamily: "'JetBrains Mono', monospace",
          }}>{p.name.toUpperCase()}</span>

          <StatusChip status={contest.status} />
        </div>

        <div style={{
          fontSize: 13.5,
          fontWeight: 700,
          color: "#f3f4f6",
          lineHeight: 1.35,
          fontFamily: "'DM Sans', sans-serif",
          marginBottom: 8,
          minHeight: 36,
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          overflow: "hidden",
        }}>{contest.name}</div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          flexWrap: "wrap",
          fontSize: 11,
          color: "#b6b6b6",
          marginBottom: 2,
          fontFamily: "'DM Sans', sans-serif",
          minHeight: 18,
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 11 }}>◷</span>{startTime24} - {endTime12}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 11 }}>⌛</span>{durationHours} Hours</span>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", padding: "9px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 9, color: "#a5b4fc", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
            {contest.status === "live" ? "ENDS IN" : "STARTS IN"}
          </div>
          <CountdownBadge time={contest.status === "live" ? contest.end : contest.start} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => addToCalendar(contest)} style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "8px 12px",
            borderRadius: 10,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.28)",
            color: "#f3f4f6",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}>+ Cal</button>

          <button
            onClick={(e) => { e.stopPropagation(); onSave?.(contest.id); }}
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "8px 12px",
              borderRadius: 10,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.28)",
              color: "#f3f4f6",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >SAVE</button>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", padding: "9px 14px", fontSize: 11, color: "#d1d5db", fontFamily: "'DM Sans', sans-serif" }}>
        ⌖ Local Time: {localDateLine} - {endTime12} ({tzText})
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, color: "#f3f4f6", fontWeight: 700, letterSpacing: "0.04em", fontFamily: "'DM Sans', sans-serif" }}>JOIN CONTEST</div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{domain}</div>
        </div>

        <a
          href={contest.url}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 12,
            fontWeight: 800,
            padding: "8px 14px",
            borderRadius: 12,
            textDecoration: "none",
            background: contest.status === "live" ? "#ef4444" : p.color,
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.16)",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          GO NOW {">"}
        </a>
      </div>
    </div>
  );
}

/* ─── Date group header ────────────────────────────────────────── */
function DateGroupHeader({ label, count }) {
  const isToday = label.startsWith("Today");
  const isTomorrow = label.startsWith("Tomorrow");

  // Split label: "Today · 29 Apr 2025" → prefix + date
  const parts = label.split(" · ");
  const prefix = parts[0];
  const dateStr = parts[1] || "";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 14,
      marginTop: 4,
    }}>
      {/* Date badge */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: isToday
          ? "rgba(99,102,241,0.15)"
          : isTomorrow
          ? "rgba(255,161,22,0.1)"
          : "rgba(255,255,255,0.04)",
        border: isToday
          ? "1px solid rgba(99,102,241,0.3)"
          : isTomorrow
          ? "1px solid rgba(255,161,22,0.2)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: "6px 14px",
        minWidth: 70,
        textAlign: "center",
        flexShrink: 0,
      }}>
        {(isToday || isTomorrow) && (
          <span style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.16em",
            fontFamily: "'JetBrains Mono', monospace",
            color: isToday ? "#818cf8" : "#FFA116",
            textTransform: "uppercase",
            marginBottom: 1,
          }}>{prefix}</span>
        )}
        <span style={{
          fontSize: isToday || isTomorrow ? 11 : 12,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          color: isToday ? "#818cf8" : isTomorrow ? "#FFA116" : "#475569",
          letterSpacing: "0.04em",
        }}>
          {isToday || isTomorrow ? dateStr : label.replace(prefix + " ", "")}
        </span>
      </div>

      {/* Divider line */}
      <div style={{
        flex: 1,
        height: 1,
        background: isToday
          ? "linear-gradient(90deg, rgba(99,102,241,0.3), transparent)"
          : isTomorrow
          ? "linear-gradient(90deg, rgba(255,161,22,0.2), transparent)"
          : "linear-gradient(90deg, rgba(255,255,255,0.06), transparent)",
      }} />

      {/* Contest count */}
      <span style={{
        fontSize: 9,
        fontFamily: "'JetBrains Mono', monospace",
        color: "#1e293b",
        letterSpacing: "0.1em",
        flexShrink: 0,
      }}>{count} CONTEST{count !== 1 ? "S" : ""}</span>
    </div>
  );
}

/* ─── Stat card ────────────────────────────────────────────────── */
function StatCard({ label, value, accent, delay = 0 }) {
  return (
    <div style={{
      position: "relative",
      background: "rgba(10,10,25,0.7)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 16, padding: "18px 20px",
      backdropFilter: "blur(12px)",
      overflow: "hidden",
      animation: `fadeUp 0.4s ease ${delay}s both`,
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accent || "#818cf8"}, transparent)`,
        opacity: 0.45,
      }} />
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.15em",
        textTransform: "uppercase", color: "#64748b",
        fontFamily: "'JetBrains Mono', monospace", marginBottom: 8,
      }}>{label}</div>
      <div style={{
        fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em",
        color: accent || "#e2e8f0",
        fontFamily: "'JetBrains Mono', monospace", lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
      }}>{value}</div>
    </div>
  );
}

/* ─── Filter pill ──────────────────────────────────────────────── */
function FilterPill({ label, active, color, bg, border, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 10, padding: "4px 13px", borderRadius: 100,
        cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700, letterSpacing: "0.08em",
        background: active ? (bg || "rgba(129,140,248,0.1)") : "transparent",
        color: active ? (color || "#818cf8") : "#334155",
        border: active ? `1px solid ${border || "rgba(129,140,248,0.25)"}` : "1px solid rgba(255,255,255,0.05)",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >{label}</button>
  );
}

/* ─── Mini calendar sidebar ────────────────────────────────────── */
function MiniCalendar({ contests }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const contestDays = new Set(
    contests.map(c => {
      const d = new Date(c.start);
      if (d.getFullYear() === year && d.getMonth() === month) return d.getDate();
      return null;
    }).filter(Boolean)
  );

  const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();

  return (
    <div>
      <div style={{
        fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
        color: "#334155", letterSpacing: "0.18em", marginBottom: 12,
      }}>{monthName}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} style={{ fontSize: 8, color: "#1e293b", textAlign: "center", fontFamily: "'JetBrains Mono', monospace", padding: "2px 0" }}>{d}</div>
        ))}
        {[...Array(firstDay)].map((_, i) => <div key={"e" + i} />)}
        {[...Array(daysInMonth)].map((_, i) => {
          const day = i + 1;
          const isToday = day === now.getDate();
          const hasContest = contestDays.has(day);
          return (
            <div key={day} style={{
              height: 22, borderRadius: 5, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 9, cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              background: isToday ? "#6366f1" : hasContest ? "rgba(99,102,241,0.1)" : "transparent",
              color: isToday ? "#fff" : hasContest ? "#818cf8" : "#1e293b",
              fontWeight: isToday || hasContest ? 700 : 400,
              border: hasContest && !isToday ? "1px solid rgba(99,102,241,0.2)" : "none",
              transition: "background 0.15s",
            }}>{day}</div>
          );
        })}
      </div>
    </div>
  );
}

function QaIcon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/* ─── Main ─────────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [platFilter, setPlatFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [flashFilters, setFlashFilters] = useState(false);
  const remindersOn = useRemindersEnabled();
  const [viewportWidth, setViewportWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = viewportWidth < 900;
  const isNarrowMobile = viewportWidth < 560;

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true); setError(null);
        const response = await contestAPI.getAll();
        if (!response.data || !Array.isArray(response.data)) throw new Error("Invalid data format");
        setContests(response.data.map(transformContest));
      } catch (err) {
        setContests([]);
        setError(err.message || "Network error");
      } finally {
        setLoading(false);
      }
    };
    fetchContests();
    const interval = setInterval(fetchContests, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filtered = contests.filter(c => {
    if (c.status === "ended") return false;
    if (platFilter !== "All" && c.platform !== platFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    const diff = c.start - Date.now();
    if (timeFilter === "Today") return diff < 86400000;
    if (timeFilter === "This week") return diff < 7 * 86400000;
    if (timeFilter === "This month") return diff < 30 * 86400000;
    return true;
  });

  // Live contests shown separately at top
  const live = filtered.filter(c => c.status === "live");
  // All non-live grouped by date
  const nonLive = filtered.filter(c => c.status !== "live");
  const dateGroups = groupByDate(nonLive);

  const platCounts = Object.keys(PLATFORMS).reduce((acc, p) => {
    acc[p] = contests.filter(c => c.platform === p && c.status !== "ended").length;
    return acc;
  }, {});

  /* ── Quick actions ── */
  const browseByPlatform = (platform) => {
    if (platform) setPlatFilter(platform);
    document.getElementById("home-filters")?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashFilters(true);
    setTimeout(() => setFlashFilters(false), 1600);
  };

  const toggleReminders = async () => {
    if (remindersOn) {
      disableReminders();
      toast("Reminders turned off");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Sign in to get reminders for the contests you save.");
      navigate("/login");
      return;
    }
    const result = await enableReminders();
    if (result === "granted") {
      toast.success(`Reminders on — we'll notify you ${REMINDER_LEAD_MINUTES} min before your saved contests while BRUHCODE is open.`, { duration: 5000 });
    } else if (result === "unsupported") {
      toast.error("This browser doesn't support notifications. Use “+ Cal” on a contest to add it to your calendar instead.", { duration: 6000 });
    } else {
      toast.error("Notifications are blocked. Allow them for this site in your browser settings, or use “+ Cal” on a contest.", { duration: 6000 });
    }
  };

  const handleSave = async (contestId) => {
    if (!isAuthenticated) { toast.error("Please sign in to save contests."); navigate("/login"); return; }
    try {
      await userAPI.addContest(contestId, "Interested");
      toast.success("Contest saved to your dashboard");
    } catch (err) {
      toast.error(err?.response?.data || "Could not save contest");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        .home-root *, .home-root *::before, .home-root *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseGlow { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes shimmer { from{background-position:-200% center} to{background-position:200% center} }
        .home-root input::placeholder { color: #1e293b; }
        .home-root input:focus { outline: none; }
        .home-qa { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border-radius: 12px; text-align: left; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: #cbd5e1;
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); transition: border-color .15s, background .15s, color .15s; }
        .home-qa:hover { color: #f8fafc; border-color: rgba(129,140,248,0.35); background: rgba(129,140,248,0.06); }
        .home-qa:focus-visible { outline: 2px solid #818cf8; outline-offset: 2px; }
        .home-qa svg { flex-shrink: 0; width: 16px; height: 16px; color: #818cf8; }
        .home-qa-sub { display: block; margin-top: 2px; font-size: 11px; font-weight: 400; color: #64748b; }
        .home-qa.is-on { border-color: rgba(52,211,153,0.35); background: rgba(52,211,153,0.06); }
        .home-qa.is-on svg { color: #34d399; }
        .home-qa-dot { width: 7px; height: 7px; border-radius: 99px; background: #34d399; box-shadow: 0 0 8px #34d399; }
        .home-plat-row { border-left: 0; border-right: 0; border-top: 0; transition: background .15s; }
        .home-plat-row:hover { background: rgba(255,255,255,0.04) !important; }
        .home-filters { border-radius: 14px; transition: box-shadow .3s ease, background .3s ease; }
        .home-filters.is-flash { box-shadow: 0 0 0 2px rgba(129,140,248,0.55), 0 0 30px rgba(129,140,248,0.25); background: rgba(129,140,248,0.05); }
        @media (prefers-reduced-motion: reduce) { .home-qa, .home-filters, .home-plat-row { transition: none; } }
        .home-root button { outline: none; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
      `}</style>

      <div className="home-root" style={{
        fontFamily: "'DM Sans', sans-serif",
        minHeight: "100vh",
        background: "#060612",
        padding: "clamp(12px, 3.5vw, 2rem)",
        color: "#e2e8f0",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>

          {/* ── Page header ── */}
          <div style={{ marginBottom: 28, animation: "fadeUp 0.4s ease 0.05s both" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              fontSize: 9, fontWeight: 700, letterSpacing: "0.22em",
              color: "#6366f1", background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.18)",
              padding: "4px 12px 4px 10px", borderRadius: 100,
              marginBottom: 14, fontFamily: "'JetBrains Mono', monospace",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1", display: "inline-block", animation: "pulseGlow 2s infinite" }} />
              Contest Hub
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h1 style={{
                  fontSize: "clamp(1.7rem, 2.6vw, 2.4rem)",
                  fontWeight: 700, letterSpacing: "-0.02em",
                  fontFamily: "'DM Sans', sans-serif", color: "#e5e7eb", lineHeight: 1.1,
                }}>
                  Upcoming{" "}
                  <span style={{
                    background: "linear-gradient(90deg, #7c8cff, #38d6b5)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>Contests</span>
                </h1>
                <p style={{ fontSize: 13, color: "#475569", marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>
                  Live data · 5 platforms · auto-refreshes every 30 min
                </p>
              </div>
              <button
                onClick={() => navigate("/calendar")}
                style={{
                  fontSize: 12, padding: "10px 20px", borderRadius: 100,
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  color: "#818cf8", cursor: "pointer", fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(99,102,241,0.12)"}
              >View Calendar ↗</button>
            </div>
          </div>

          {/* ── Main layout ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "minmax(0,1fr)" : "minmax(0,1fr) 260px",
            gap: 20,
            alignItems: "start",
          }}>

            {/* ── Left column ── */}
            <div>
              {/* Stats */}
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile
                  ? (isNarrowMobile ? "minmax(0,1fr)" : "repeat(2,minmax(0,1fr))")
                  : "repeat(4,minmax(0,1fr))",
                gap: 10,
                marginBottom: 20,
              }}>
                <StatCard label="Total"         value={contests.filter(c=>c.status!=="ended").length} accent="#818cf8" delay={0.1} />
                <StatCard label="Live Now"      value={live.length}     accent="#FF4D4D" delay={0.15} />
                <StatCard label="Starting Soon" value={filtered.filter(c=>c.status==="soon").length} accent="#FFA116" delay={0.2} />
                <StatCard label="Upcoming"      value={filtered.filter(c=>c.status==="upcoming").length} accent="#00C896" delay={0.25} />
              </div>

              {/* Filters + Search */}
              <div id="home-filters" className={flashFilters ? "home-filters is-flash" : "home-filters"} style={{
                display: "flex", alignItems: "center", gap: 8,
                flexWrap: "wrap", marginBottom: 20,
                animation: "fadeUp 0.4s ease 0.3s both",
              }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <span style={{
                    position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                    fontSize: 12, color: "#334155",
                  }}>⌕</span>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search contests…"
                    style={{
                      background: "rgba(10,10,25,0.7)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 100, color: "#94a3b8",
                      padding: "5px 14px 5px 28px",
                      fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                      width: 180,
                    }}
                  />
                </div>

                <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.06)", margin: "0 4px" }} />

                {FILTER_PLAT.map(p => {
                  const meta = PLATFORMS[p];
                  return (
                    <FilterPill
                      key={p}
                      label={meta ? meta.short : "ALL"}
                      active={platFilter === p}
                      color={meta?.color}
                      bg={meta?.bg}
                      border={meta?.border}
                      onClick={() => setPlatFilter(p)}
                    />
                  );
                })}

                <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.06)", margin: "0 4px" }} />

                {FILTER_TIME.map(t => (
                  <FilterPill
                    key={t}
                    label={t.toUpperCase()}
                    active={timeFilter === t}
                    onClick={() => setTimeFilter(t)}
                  />
                ))}
              </div>

              {/* ── Loading ── */}
              {loading && (
                <div style={{ textAlign: "center", padding: "60px 0", animation: "fadeUp 0.4s ease both" }}>
                  <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#334155", letterSpacing: "0.15em", animation: "pulseGlow 1.5s infinite" }}>LOADING CONTESTS…</div>
                </div>
              )}

              {/* ── Error ── */}
              {error && (
                <div style={{
                  padding: "32px 24px", textAlign: "center",
                  background: "rgba(255,77,77,0.05)", borderRadius: 18,
                  border: "1px solid rgba(255,77,77,0.15)",
                  animation: "fadeUp 0.4s ease both",
                }}>
                  <div style={{ fontSize: 11, color: "#FF4D4D", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em", marginBottom: 10 }}>⚠ FETCH ERROR</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 18 }}>{error}</div>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      padding: "8px 20px", background: "rgba(255,77,77,0.1)",
                      border: "1px solid rgba(255,77,77,0.25)", color: "#FF4D4D",
                      borderRadius: 100, cursor: "pointer", fontSize: 12,
                      fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                    }}
                  >Retry ↺</button>
                </div>
              )}

              {/* ── Content ── */}
              {!loading && !error && (
                <>
                  {/* LIVE section — always at top, no date group */}
                  {live.length > 0 && (
                    <div style={{ marginBottom: 32 }}>
                      {/* Live header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "#FF4D4D", boxShadow: "0 0 8px #FF4D4D",
                          display: "inline-block", animation: "pulseGlow 1.5s infinite",
                          flexShrink: 0,
                        }} />
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
                          color: "#FF4D4D", fontFamily: "'JetBrains Mono', monospace",
                        }}>LIVE NOW</span>
                        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(255,77,77,0.3), transparent)" }} />
                        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#1e293b", letterSpacing: "0.1em" }}>{live.length} CONTEST{live.length !== 1 ? "S" : ""}</span>
                      </div>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "minmax(0,1fr)" : "repeat(2,minmax(0,1fr))",
                        gap: 10,
                      }}>
                        {live.map((c, i) => <ContestCard key={c.id} contest={c} onSave={handleSave} index={i} />)}
                      </div>
                    </div>
                  )}

                  {/* DATE-GROUPED contests */}
                  {dateGroups.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                      {dateGroups.map((group) => (
                        <div key={group.label}>
                          <DateGroupHeader label={group.label} count={group.contests.length} />
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: isMobile ? "minmax(0,1fr)" : "repeat(2,minmax(0,1fr))",
                            gap: 10,
                          }}>
                            {group.contests.map((c, i) => (
                              <ContestCard key={c.id} contest={c} onSave={handleSave} index={i} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : live.length === 0 && (
                    <div style={{
                      textAlign: "center", padding: "60px 0",
                      color: "#1e293b", fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12, letterSpacing: "0.1em",
                    }}>
                      NO CONTESTS MATCH YOUR FILTER
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.4s ease 0.35s both" }}>

              {/* Mini calendar */}
              <div style={{
                background: "rgba(10,10,25,0.7)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20, padding: 18, backdropFilter: "blur(12px)",
              }}>
                <MiniCalendar contests={contests} />
              </div>

              {/* Platform counts */}
              <div style={{
                background: "rgba(10,10,25,0.7)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20, padding: 18, backdropFilter: "blur(12px)",
              }}>
                <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#334155", letterSpacing: "0.18em", marginBottom: 14 }}>PLATFORMS</div>
                {Object.entries(PLATFORMS).map(([key, p]) => (
                  <button key={key} type="button" className="home-plat-row" onClick={() => browseByPlatform(key)} aria-pressed={platFilter === key} title={`Show only ${p.name} contests`} style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 6px", margin: "0 -6px", borderRadius: 8, cursor: "pointer",
                    background: platFilter === key ? "rgba(255,255,255,0.04)" : "transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, boxShadow: `0 0 5px ${p.color}88`, display: "inline-block" }} />
                      <span style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>{p.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.color, fontFamily: "'JetBrains Mono', monospace" }}>
                      {platCounts[key]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Quick actions */}
              <div style={{
                background: "rgba(10,10,25,0.7)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20, padding: 18, backdropFilter: "blur(12px)",
              }}>
                <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#334155", letterSpacing: "0.18em", marginBottom: 12 }}>QUICK ACTIONS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <button type="button" className={remindersOn ? "home-qa is-on" : "home-qa"} onClick={toggleReminders} aria-pressed={remindersOn}>
                    <QaIcon d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    <span style={{ flex: 1 }}>
                      {remindersOn ? "Reminders on" : "Set reminder alerts"}
                      <span className="home-qa-sub">
                        {remindersOn ? `${REMINDER_LEAD_MINUTES} min before saved contests · tap to turn off` : `Get notified ${REMINDER_LEAD_MINUTES} min before saved contests`}
                      </span>
                    </span>
                    {remindersOn && <span className="home-qa-dot" />}
                  </button>
                  <button type="button" className="home-qa" onClick={() => browseByPlatform()}>
                    <QaIcon d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4" />
                    <span style={{ flex: 1 }}>
                      Browse by platform
                      <span className="home-qa-sub">Filter the list to one judge</span>
                    </span>
                  </button>
                  <button type="button" className="home-qa" onClick={() => navigate("/calendar")}>
                    <QaIcon d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
                    <span style={{ flex: 1 }}>
                      View calendar
                      <span className="home-qa-sub">{isAuthenticated ? "Month and week views" : "Sign in to open your calendar"}</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}