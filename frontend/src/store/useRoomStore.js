import { create } from 'zustand';

const useRoomStore = create((set) => ({
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

  // Reset all room state
  resetRoom: () =>
    set({
      room: null,
      members: [],
      leaderboard: [],
      grid: {},
      timer: { remainingSeconds: 0, totalSeconds: 0, status: 'Scheduled' },
    }),
}));

export default useRoomStore;
