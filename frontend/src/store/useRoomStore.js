import { create } from 'zustand';

const useRoomStore = create((set, get) => ({
  // Current room data
  room: null,
  setRoom: (room) => set({ room }),

  // Members list with online status
  members: [],
  setMembers: (members) => set({ members }),
  addMember: (member) =>
    set((s) => ({
      members: s.members.some((m) => m.userId === member.userId)
        ? s.members
        : [...s.members, member],
    })),
  removeMember: (userId) =>
    set((s) => ({ members: s.members.filter((m) => m.userId !== userId) })),

  // Leaderboard — sorted ranking array
  leaderboard: [],
  setLeaderboard: (leaderboard) => set({ leaderboard }),

  // Solve grid: { [userId]: { [problemId]: { status, solvedAt, attempts } } }
  grid: {},
  setGrid: (grid) => set({ grid }),
  updateGridCell: (userId, problemId, data) =>
    set((s) => ({
      grid: {
        ...s.grid,
        [userId]: {
          ...(s.grid[userId] || {}),
          [problemId]: { ...(s.grid[userId]?.[problemId] || {}), ...data },
        },
      },
    })),

  // Server-synced timer
  timer: { remainingSeconds: 0, totalSeconds: 0, status: 'Scheduled' },
  setTimer: (timer) => set({ timer }),

  // Messages grouped by problemId (0 = general chat)
  messages: {},
  setMessages: (problemId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [problemId || 0]: msgs } })),
  addMessage: (msg) =>
    set((s) => {
      const key = msg.problemId || 0;
      const existing = s.messages[key] || [];
      return { messages: { ...s.messages, [key]: [...existing, msg] } };
    }),

  // Unlocked threads: Set of "userId_problemId" keys
  unlockedThreads: new Set(),
  unlockThread: (userId, problemId) =>
    set((s) => {
      const next = new Set(s.unlockedThreads);
      next.add(`${userId}_${problemId}`);
      return { unlockedThreads: next };
    }),
  isThreadUnlocked: (userId, problemId) =>
    get().unlockedThreads.has(`${userId}_${problemId}`),

  // Connection status
  connectionStatus: 'disconnected', // 'connected' | 'reconnecting' | 'disconnected'
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  // Reset all room state
  resetRoom: () =>
    set({
      room: null,
      members: [],
      leaderboard: [],
      grid: {},
      timer: { remainingSeconds: 0, totalSeconds: 0, status: 'Scheduled' },
      messages: {},
      unlockedThreads: new Set(),
      connectionStatus: 'disconnected',
    }),
}));

export default useRoomStore;
