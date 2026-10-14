using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class ThreadLockService
    {
        private readonly AppDbContext _db;

        public ThreadLockService(AppDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Determines whether a user can view/post in a problem's discussion thread.
        /// Thread is UNLOCKED if:
        ///   1. The room has ended (status == Ended), OR
        ///   2. The user has marked the problem as Attempted or Solved.
        /// Otherwise the thread is LOCKED (anti-spoiler protection).
        /// </summary>
        public async Task<bool> IsThreadUnlockedAsync(int roomId, int userId, int roomProblemId)
        {
            // Check if room has ended — unlocks all threads for everyone
            var room = await _db.Rooms.AsNoTracking().FirstOrDefaultAsync(r => r.Id == roomId);
            if (room == null) return false;
            if (room.Status == RoomStatus.Ended) return true;

            // Check if the user has attempted/solved this specific problem
            var progress = await _db.RoomProgress.AsNoTracking()
                .FirstOrDefaultAsync(rp =>
                    rp.RoomId == roomId &&
                    rp.UserId == userId &&
                    rp.RoomProblemId == roomProblemId);

            if (progress == null) return false;

            return progress.Status == SolveStatus.Attempted || progress.Status == SolveStatus.Solved;
        }

        /// <summary>
        /// Validates that a user can post a message to a problem thread.
        /// Returns (allowed, reason).
        /// </summary>
        public async Task<(bool Allowed, string Reason)> CanPostMessageAsync(int roomId, int userId, int? roomProblemId)
        {
            // General chat (no problem scope) is always allowed
            if (roomProblemId == null) return (true, "General chat is open");

            var unlocked = await IsThreadUnlockedAsync(roomId, userId, roomProblemId.Value);
            if (!unlocked)
                return (false, "Thread is locked — solve or attempt this problem first, or wait until the session ends.");

            return (true, "Thread unlocked");
        }
    }
}
