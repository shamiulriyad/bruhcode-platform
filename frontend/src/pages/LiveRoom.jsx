import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { roomAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import useRoomStore from '../store/useRoomStore';
import { startConnection, isFallbackPolling } from '../utils/signalr';
import CountdownRing from '../components/rooms/CountdownRing';
import LeaderboardPanel from '../components/rooms/LeaderboardPanel';
import SolveGrid from '../components/rooms/SolveGrid';
import ProblemThread from '../components/rooms/ProblemThread';

export default function LiveRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    room, setRoom, members, setMembers, addMember, removeMember,
    leaderboard, setLeaderboard, grid, setGrid, updateGridCell,
    timer, setTimer, messages, setMessages, addMessage,
    unlockedThreads, unlockThread, resetRoom, setConnectionStatus,
  } = useRoomStore();

  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [threadLocked, setThreadLocked] = useState(true);
  const pollRef = useRef(null);
  const connRef = useRef(null);

  // Fetch room data
  const fetchRoom = useCallback(async () => {
    try {
      const { data } = await roomAPI.getById(id);
      setRoom(data);
      setMembers(data.members || []);
      if (data.status === 'Ended') {
        navigate(`/rooms/${id}/summary`);
        return;
      }
      if (data.problems?.length > 0 && !selectedProblem) {
        setSelectedProblem(data.problems[0]);
      }
    } catch (err) {
      toast.error('Failed to load room');
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  }, [id, setRoom, setMembers, navigate, selectedProblem]);

  // Fetch leaderboard via REST
  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data } = await roomAPI.getLeaderboard(id);
      setLeaderboard(data);
    } catch {}
  }, [id, setLeaderboard]);

  useEffect(() => {
    fetchRoom();
    fetchLeaderboard();
    return () => resetRoom();
  }, [fetchRoom, fetchLeaderboard, resetRoom]);

  // SignalR connection
  useEffect(() => {
    const setupSignalR = async () => {
      try {
        const conn = await startConnection();
        connRef.current = conn;
        await conn.invoke('JoinRoom', parseInt(id));
        setConnectionStatus('connected');

        conn.on('TimerSync', (data) => setTimer(data));

        conn.on('RoomStatusChanged', (data) => {
          if (data.status === 'Ended') {
            toast.success('Session ended!', { icon: '🏁' });
            navigate(`/rooms/${id}/summary`);
          }
        });

        conn.on('GridUpdate', (data) => {
          updateGridCell(data.userId, data.problemId, {
            status: data.status,
            solvedAt: data.solvedAt,
            attempts: data.attempts,
          });
        });

        conn.on('LeaderboardUpdate', (data) => setLeaderboard(data));

        conn.on('ThreadUnlocked', (data) => {
          unlockThread(data.userId, data.problemId);
          // Refresh thread if viewing this problem
          if (data.userId === user?.id && selectedProblem?.id === data.problemId) {
            fetchThreadMessages(data.problemId);
          }
        });

        conn.on('MemberJoined', (data) => addMember(data));
        conn.on('MemberLeft', (data) => removeMember(data.userId));

        conn.on('NewMessage', (msg) => {
          addMessage(msg);
          if (msg.problemId === selectedProblem?.id) {
            setThreadMessages((prev) => [...prev, msg]);
          }
        });
      } catch (err) {
        console.error('SignalR error:', err);
        setConnectionStatus('disconnected');
        // Start fallback polling
        pollRef.current = setInterval(() => {
          fetchLeaderboard();
        }, 10000);
      }
    };

    setupSignalR();

    return () => {
      if (connRef.current) {
        connRef.current.invoke('LeaveRoom', parseInt(id)).catch(() => {});
        connRef.current.off('TimerSync');
        connRef.current.off('RoomStatusChanged');
        connRef.current.off('GridUpdate');
        connRef.current.off('LeaderboardUpdate');
        connRef.current.off('ThreadUnlocked');
        connRef.current.off('MemberJoined');
        connRef.current.off('MemberLeft');
        connRef.current.off('NewMessage');
      }
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  // Fetch thread messages when problem selection changes
  const fetchThreadMessages = useCallback(async (problemId) => {
    if (!problemId) return;
    try {
      const { data } = await roomAPI.getMessages(id, problemId);
      setThreadLocked(data.locked);
      setThreadMessages(data.messages || []);
    } catch {}
  }, [id]);

  useEffect(() => {
    if (selectedProblem?.id) {
      fetchThreadMessages(selectedProblem.id);
    }
  }, [selectedProblem?.id, fetchThreadMessages]);

  // Handle progress update
  const handleProgressUpdate = async (problemId, status) => {
    try {
      await roomAPI.updateProgress(id, problemId, status);
      toast.success(`Marked as ${status}`, { icon: status === 'Solved' ? '✅' : '⏳' });
    } catch (err) {
      toast.error('Failed to update progress');
    }
  };

  // Handle send message
  const handleSendMessage = async (content) => {
    try {
      await roomAPI.postMessage(id, {
        roomProblemId: selectedProblem?.id,
        content,
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: '#64748b', fontSize: 14 }}>Loading session...</div>
      </div>
    );
  }

  const problems = room?.problems || [];

  return (
    <div style={{ maxWidth: '90rem', margin: '0 auto', padding: '16px 16px 32px' }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginBottom: 16, padding: '12px 16px',
        background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
            {room?.name}
          </h1>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            padding: '3px 8px', borderRadius: 5,
            background: 'rgba(255,77,77,0.08)', color: '#FF4D4D',
            border: '1px solid rgba(255,77,77,0.25)',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            ● LIVE
          </span>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            👥 {members.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CountdownRing
            totalSeconds={timer.totalSeconds || (room?.durationMinutes || 120) * 60}
            remainingSeconds={timer.remainingSeconds}
            size={48}
            strokeWidth={4}
          />
          {/* Connection indicator */}
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isFallbackPolling() ? '#f59e0b' : '#34d399',
          }} title={isFallbackPolling() ? 'Polling (reconnecting...)' : 'Connected'} />
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 320px', gap: 14, alignItems: 'start' }}>

        {/* Left Panel — Problem List */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(15,23,42,0.7), rgba(15,23,42,0.5))',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
          padding: 14, backdropFilter: 'blur(12px)',
        }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', margin: '0 0 12px' }}>
            📋 Problems
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {problems.map((problem) => {
              const userProgress = grid?.[user?.id]?.[problem.id];
              const status = userProgress?.status || 'Unattempted';
              const isActive = selectedProblem?.id === problem.id;

              return (
                <div
                  key={problem.id}
                  onClick={() => setSelectedProblem(problem)}
                  style={{
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    background: isActive ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.02)',
                    border: isActive ? '1px solid rgba(56,189,248,0.25)' : '1px solid rgba(255,255,255,0.04)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>
                      {problem.problemIndex}
                    </span>
                    <StatusDropdown
                      current={status}
                      onChange={(s) => handleProgressUpdate(problem.id, s)}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>
                    {problem.problemName}
                  </div>
                  {problem.problemUrl && (
                    <a
                      href={problem.problemUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: 10, color: '#64748b', textDecoration: 'none' }}
                    >
                      Open on judge →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Panel — Grid + Leaderboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SolveGrid
            members={members}
            problems={problems}
            grid={grid}
          />
          <LeaderboardPanel
            leaderboard={leaderboard}
            currentUserId={user?.id}
          />
        </div>

        {/* Right Panel — Problem Thread */}
        <ProblemThread
          problemId={selectedProblem?.id}
          problemName={selectedProblem ? `${selectedProblem.problemIndex} — ${selectedProblem.problemName}` : 'Select a problem'}
          isLocked={threadLocked}
          messages={threadMessages}
          onSendMessage={handleSendMessage}
          currentUserId={user?.id}
        />
      </div>

      {/* Mobile: switch to tabs at <768px */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 260px 1fr 320px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ─── Status dropdown for problem ──────────────────────────────── */
function StatusDropdown({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const options = ['Unattempted', 'Attempted', 'Solved'];
  const colors = { Unattempted: '#64748b', Attempted: '#fbbf24', Solved: '#34d399' };
  const icons = { Unattempted: '○', Attempted: '⏳', Solved: '✓' };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px',
          borderRadius: 5, border: `1px solid ${colors[current]}30`,
          background: `${colors[current]}15`, color: colors[current],
          cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {icons[current]} {current}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, overflow: 'hidden', zIndex: 20, minWidth: 120,
        }}>
          {options.filter(o => o !== current).map(opt => (
            <button
              key={opt}
              onClick={(e) => { e.stopPropagation(); onChange(opt); setOpen(false); }}
              style={{
                display: 'block', width: '100%', padding: '8px 12px',
                border: 'none', background: 'transparent',
                color: colors[opt], fontSize: 11, fontWeight: 600,
                cursor: 'pointer', textAlign: 'left',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {icons[opt]} Mark as {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
