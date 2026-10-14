using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Backend.Hubs
{
    [Authorize]
    public class RoomHub : Hub
    {
        private readonly AppDbContext _db;
        private readonly ThreadLockService _lockService;

        public RoomHub(AppDbContext db, ThreadLockService lockService)
        {
            _db = db;
            _lockService = lockService;
        }

        private int GetUserId() =>
            int.Parse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

        /// <summary>
        /// Client calls this to join a room's SignalR group and receive real-time updates.
        /// </summary>
        public async Task JoinRoom(int roomId)
        {
            var userId = GetUserId();

            // Verify user is a member of this room
            var isMember = await _db.RoomMembers
                .AnyAsync(m => m.RoomId == roomId && m.UserId == userId);

            if (!isMember)
            {
                await Clients.Caller.SendAsync("Error", new { message = "Not a member of this room" });
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, $"room_{roomId}");

            var user = await _db.Users.FindAsync(userId);

            // Notify other members
            await Clients.OthersInGroup($"room_{roomId}").SendAsync("MemberJoined", new
            {
                userId,
                displayName = user?.DisplayName ?? "",
                profilePic = user?.ProfilePictureUrl,
                isOnline = true,
            });

            // Send current presence to the caller
            // (We don't track connections in DB for simplicity — just send MemberJoined)
            await Clients.Caller.SendAsync("PresenceUpdate", new
            {
                userId,
                joined = true,
            });
        }

        /// <summary>
        /// Client calls this to leave a room's SignalR group.
        /// </summary>
        public async Task LeaveRoom(int roomId)
        {
            var userId = GetUserId();

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"room_{roomId}");

            await Clients.Group($"room_{roomId}").SendAsync("MemberLeft", new
            {
                userId,
            });
        }

        /// <summary>
        /// Client reports a progress update (Attempted/Solved) for a problem.
        /// Server validates, persists, and broadcasts to the room.
        /// </summary>
        public async Task UpdateProgress(int roomId, int roomProblemId, string status)
        {
            var userId = GetUserId();

            // Verify membership
            var isMember = await _db.RoomMembers
                .AnyAsync(m => m.RoomId == roomId && m.UserId == userId);
            if (!isMember) return;

            // Verify problem belongs to room
            var problem = await _db.RoomProblems
                .FirstOrDefaultAsync(p => p.Id == roomProblemId && p.RoomId == roomId);
            if (problem == null) return;

            if (!Enum.TryParse<SolveStatus>(status, true, out var solveStatus)) return;

            var progress = await _db.RoomProgress
                .FirstOrDefaultAsync(p => p.RoomId == roomId && p.UserId == userId && p.RoomProblemId == roomProblemId);

            if (progress == null)
            {
                progress = new RoomProgress
                {
                    RoomId = roomId,
                    UserId = userId,
                    RoomProblemId = roomProblemId,
                };
                _db.RoomProgress.Add(progress);
            }

            progress.Status = solveStatus;
            progress.Attempts += 1;

            if (solveStatus == SolveStatus.Solved && progress.SolvedAt == null)
                progress.SolvedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            // Broadcast grid update
            await Clients.Group($"room_{roomId}").SendAsync("GridUpdate", new
            {
                userId,
                problemId = roomProblemId,
                status = solveStatus.ToString(),
                solvedAt = progress.SolvedAt,
                attempts = progress.Attempts,
            });

            // Notify thread unlock if applicable
            if (solveStatus == SolveStatus.Attempted || solveStatus == SolveStatus.Solved)
            {
                await Clients.Group($"room_{roomId}").SendAsync("ThreadUnlocked", new
                {
                    userId,
                    problemId = roomProblemId,
                });
            }

            // Broadcast updated leaderboard
            await BroadcastLeaderboardAsync(roomId);
        }

        /// <summary>
        /// Client sends a message to a problem thread (or general chat if problemId is null).
        /// Server validates lock, persists, and broadcasts.
        /// </summary>
        public async Task SendMessage(int roomId, int? roomProblemId, string content)
        {
            var userId = GetUserId();

            // Verify membership
            var isMember = await _db.RoomMembers
                .AnyAsync(m => m.RoomId == roomId && m.UserId == userId);
            if (!isMember) return;

            // Check lock
            var (allowed, reason) = await _lockService.CanPostMessageAsync(roomId, userId, roomProblemId);
            if (!allowed)
            {
                await Clients.Caller.SendAsync("Error", new { message = reason });
                return;
            }

            var message = new RoomMessage
            {
                RoomId = roomId,
                RoomProblemId = roomProblemId,
                UserId = userId,
                Content = content,
            };

            _db.RoomMessages.Add(message);
            await _db.SaveChangesAsync();

            var user = await _db.Users.FindAsync(userId);

            await Clients.Group($"room_{roomId}").SendAsync("NewMessage", new
            {
                messageId = message.Id,
                userId,
                displayName = user?.DisplayName ?? "",
                profilePic = user?.ProfilePictureUrl,
                problemId = roomProblemId,
                content,
                createdAt = message.CreatedAt,
            });
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // SignalR automatically removes the connection from all groups.
            // We could track online status here if we kept a connection mapping.
            await base.OnDisconnectedAsync(exception);
        }

        // ─── Helpers ───────────────────────────────────────────────────

        private async Task BroadcastLeaderboardAsync(int roomId)
        {
            var members = await _db.RoomMembers
                .Where(m => m.RoomId == roomId)
                .Include(m => m.User)
                .ToListAsync();

            var room = await _db.Rooms.FindAsync(roomId);

            var board = new List<object>();

            foreach (var member in members)
            {
                var progresses = await _db.RoomProgress
                    .Where(p => p.RoomId == roomId && p.UserId == member.UserId)
                    .ToListAsync();

                var solvedCount = progresses.Count(p => p.Status == SolveStatus.Solved);
                var totalTimeSec = progresses
                    .Where(p => p.Status == SolveStatus.Solved && p.SolvedAt != null && room != null)
                    .Sum(p => (p.SolvedAt!.Value - room!.StartTime).TotalSeconds);

                board.Add(new
                {
                    userId = member.UserId,
                    displayName = member.User?.DisplayName ?? "",
                    profilePic = member.User?.ProfilePictureUrl,
                    solvedCount,
                    totalTimeSec = Math.Round(totalTimeSec, 0),
                    attempts = progresses.Sum(p => p.Attempts),
                });
            }

            var sorted = board
                .OrderByDescending(b => (int)(b.GetType().GetProperty("solvedCount")?.GetValue(b) ?? 0))
                .ThenBy(b => (double)(b.GetType().GetProperty("totalTimeSec")?.GetValue(b) ?? 0))
                .Select((b, i) =>
                {
                    var type = b.GetType();
                    return (object)new
                    {
                        rank = i + 1,
                        userId = (int)(type.GetProperty("userId")?.GetValue(b) ?? 0),
                        displayName = (string)(type.GetProperty("displayName")?.GetValue(b) ?? ""),
                        profilePic = (string?)(type.GetProperty("profilePic")?.GetValue(b)),
                        solvedCount = (int)(type.GetProperty("solvedCount")?.GetValue(b) ?? 0),
                        totalTimeSec = (double)(type.GetProperty("totalTimeSec")?.GetValue(b) ?? 0.0),
                        attempts = (int)(type.GetProperty("attempts")?.GetValue(b) ?? 0),
                    };
                })
                .ToList();

            await Clients.Group($"room_{roomId}").SendAsync("LeaderboardUpdate", sorted);
        }
    }
}
