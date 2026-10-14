using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public record LeaderboardEntry(
        int Rank,
        int UserId,
        string DisplayName,
        string? ProfilePic,
        int SolvedCount,
        double TotalTimeSec,
        int Attempts);

    public static class RoomLeaderboard
    {
        /// <summary>
        /// Ranks room members by problems solved (desc), then by total solve time
        /// measured from the room start (asc).
        /// </summary>
        public static async Task<List<LeaderboardEntry>> BuildAsync(AppDbContext db, int roomId)
        {
            var room = await db.Rooms.FindAsync(roomId);

            var members = await db.RoomMembers
                .Where(m => m.RoomId == roomId)
                .Include(m => m.User)
                .ToListAsync();

            var progress = await db.RoomProgress
                .Where(p => p.RoomId == roomId)
                .ToListAsync();

            return members
                .Select(member =>
                {
                    var mine = progress.Where(p => p.UserId == member.UserId).ToList();
                    var totalTimeSec = room == null ? 0 : mine
                        .Where(p => p.Status == SolveStatus.Solved && p.SolvedAt != null)
                        .Sum(p => (p.SolvedAt!.Value - room.StartTime).TotalSeconds);

                    return new
                    {
                        member.UserId,
                        DisplayName = member.User?.DisplayName ?? "",
                        ProfilePic = member.User?.ProfilePictureUrl,
                        SolvedCount = mine.Count(p => p.Status == SolveStatus.Solved),
                        TotalTimeSec = Math.Round(totalTimeSec, 0),
                        Attempts = mine.Sum(p => p.Attempts),
                    };
                })
                .OrderByDescending(e => e.SolvedCount)
                .ThenBy(e => e.TotalTimeSec)
                .Select((e, i) => new LeaderboardEntry(
                    i + 1, e.UserId, e.DisplayName, e.ProfilePic, e.SolvedCount, e.TotalTimeSec, e.Attempts))
                .ToList();
        }
    }
}
