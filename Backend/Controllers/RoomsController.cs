using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RoomsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ThreadLockService _lockService;
        private readonly IHubContext<Backend.Hubs.RoomHub> _hubContext;

        public RoomsController(AppDbContext db, ThreadLockService lockService, IHubContext<Backend.Hubs.RoomHub> hubContext)
        {
            _db = db;
            _lockService = lockService;
            _hubContext = hubContext;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

        // ─── DTOs ──────────────────────────────────────────────────────

        public record CreateRoomRequest(
            string Name,
            int ContestId,
            DateTime StartTime,
            int DurationMinutes,
            string Visibility,
            List<ProblemInput> Problems
        );

        public record ProblemInput(string Index, string Name, string Url);

        public record JoinRoomRequest(string InviteCode);

        public record UpdateProgressRequest(int RoomProblemId, string Status);

        public record PostMessageRequest(int? RoomProblemId, string Content, int? ParentMessageId);

        // ─── Create Room ───────────────────────────────────────────────

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRoomRequest req)
        {
            var userId = GetUserId();
            if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(new { error = "Room name is required" });
            var problems = (req.Problems ?? new List<ProblemInput>()).Where(p => !string.IsNullOrWhiteSpace(p.Name)).ToList();
            if (problems.Count == 0) return BadRequest(new { error = "Add at least one problem" });

            var contest = await _db.Contests.FindAsync(req.ContestId);
            if (contest == null) return NotFound(new { error = "Contest not found" });

            // Generate unique 8-char invite code
            string inviteCode;
            do
            {
                inviteCode = Guid.NewGuid().ToString("N")[..8].ToUpper();
            } while (await _db.Rooms.AnyAsync(r => r.InviteCode == inviteCode));

            var room = new Room
            {
                Name = req.Name.Trim(),
                ContestId = req.ContestId,
                HostId = userId,
                StartTime = req.StartTime.ToUniversalTime(),
                DurationMinutes = req.DurationMinutes > 0 ? req.DurationMinutes : contest.Duration,
                Visibility = Enum.TryParse<RoomVisibility>(req.Visibility, true, out var vis) ? vis : RoomVisibility.Private,
                InviteCode = inviteCode,
                Status = RoomStatus.Scheduled,
            };

            _db.Rooms.Add(room);
            await _db.SaveChangesAsync();

            // Add problems
            for (int i = 0; i < problems.Count; i++)
            {
                var p = problems[i];
                _db.RoomProblems.Add(new RoomProblem
                {
                    RoomId = room.Id,
                    ProblemIndex = string.IsNullOrEmpty(p.Index) ? ((char)('A' + i)).ToString() : p.Index,
                    ProblemName = p.Name.Trim(),
                    ProblemUrl = p.Url?.Trim() ?? "",
                    SortOrder = i,
                });
            }

            // Add host as first member
            _db.RoomMembers.Add(new RoomMember
            {
                RoomId = room.Id,
                UserId = userId,
                Role = MemberRole.Host,
            });

            await _db.SaveChangesAsync();

            return Ok(new
            {
                room.Id,
                room.Name,
                room.InviteCode,
                room.Status,
                room.StartTime,
                room.DurationMinutes,
            });
        }

        // ─── List Rooms ────────────────────────────────────────────────

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = GetUserId();

            var rooms = await _db.Rooms
                .Include(r => r.Contest)
                .Include(r => r.Host)
                .Include(r => r.Members)
                .Where(r =>
                    r.Visibility == RoomVisibility.Public ||
                    r.Members.Any(m => m.UserId == userId))
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.Name,
                    r.InviteCode,
                    Status = r.Status.ToString(),
                    Visibility = r.Visibility.ToString(),
                    r.StartTime,
                    r.DurationMinutes,
                    ContestName = r.Contest != null ? r.Contest.Name : "",
                    ContestPlatform = r.Contest != null ? r.Contest.Platform : "",
                    HostName = r.Host != null ? r.Host.DisplayName : "",
                    MemberCount = r.Members.Count,
                    r.MaxMembers,
                    IsMember = r.Members.Any(m => m.UserId == userId),
                    IsHost = r.HostId == userId,
                })
                .ToListAsync();

            return Ok(rooms);
        }

        // ─── Get Room Detail ───────────────────────────────────────────

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = GetUserId();
            var room = await _db.Rooms
                .Include(r => r.Contest)
                .Include(r => r.Host)
                .Include(r => r.Members).ThenInclude(m => m.User)
                .Include(r => r.Problems.OrderBy(p => p.SortOrder))
                .FirstOrDefaultAsync(r => r.Id == id);

            if (room == null) return NotFound();

            // Check access
            var isMember = room.Members.Any(m => m.UserId == userId);
            if (room.Visibility == RoomVisibility.Private && !isMember)
                return Forbid();

            return Ok(new
            {
                room.Id,
                room.Name,
                room.InviteCode,
                Status = room.Status.ToString(),
                Visibility = room.Visibility.ToString(),
                room.StartTime,
                room.DurationMinutes,
                room.MaxMembers,
                IsHost = room.HostId == userId,
                IsMember = isMember,
                Contest = room.Contest != null ? new
                {
                    room.Contest.Id,
                    room.Contest.Name,
                    room.Contest.Platform,
                    room.Contest.Url,
                    room.Contest.Duration,
                } : null,
                Host = room.Host != null ? new
                {
                    room.Host.Id,
                    room.Host.DisplayName,
                    room.Host.ProfilePictureUrl,
                } : null,
                Members = room.Members.Select(m => new
                {
                    m.UserId,
                    DisplayName = m.User?.DisplayName ?? "",
                    ProfilePictureUrl = m.User?.ProfilePictureUrl,
                    Role = m.Role.ToString(),
                    m.JoinedAt,
                }),
                Problems = room.Problems.Select(p => new
                {
                    p.Id,
                    p.ProblemIndex,
                    p.ProblemName,
                    p.ProblemUrl,
                    p.SortOrder,
                }),
            });
        }

        // ─── Join Room by Invite Code ──────────────────────────────────

        [HttpPost("join")]
        public async Task<IActionResult> JoinByCode([FromBody] JoinRoomRequest req)
        {
            var userId = GetUserId();
            var room = await _db.Rooms
                .Include(r => r.Members)
                .FirstOrDefaultAsync(r => r.InviteCode == req.InviteCode.ToUpper());

            if (room == null) return NotFound(new { error = "Invalid invite code" });
            if (room.Status == RoomStatus.Ended) return BadRequest(new { error = "This room has already ended" });
            if (room.Members.Any(m => m.UserId == userId)) return Ok(new { room.Id, message = "Already a member" });
            if (room.Members.Count >= room.MaxMembers) return BadRequest(new { error = "Room is full" });

            _db.RoomMembers.Add(new RoomMember
            {
                RoomId = room.Id,
                UserId = userId,
                Role = MemberRole.Member,
            });
            await _db.SaveChangesAsync();

            // Notify room via SignalR
            var user = await _db.Users.FindAsync(userId);
            await _hubContext.Clients
                .Group($"room_{room.Id}")
                .SendAsync("MemberJoined", new
                {
                    userId,
                    displayName = user?.DisplayName ?? "",
                    profilePic = user?.ProfilePictureUrl,
                });

            return Ok(new { room.Id, message = "Joined successfully" });
        }

        // ─── Lookup Room by Invite Code ────────────────────────────────

        [HttpGet("join/{inviteCode}")]
        public async Task<IActionResult> LookupByCode(string inviteCode)
        {
            var room = await _db.Rooms
                .Include(r => r.Contest)
                .Include(r => r.Members)
                .FirstOrDefaultAsync(r => r.InviteCode == inviteCode.ToUpper());

            if (room == null) return NotFound(new { error = "Invalid invite code" });

            return Ok(new
            {
                room.Id,
                room.Name,
                Status = room.Status.ToString(),
                ContestName = room.Contest?.Name ?? "",
                ContestPlatform = room.Contest?.Platform ?? "",
                MemberCount = room.Members.Count,
                room.MaxMembers,
                room.StartTime,
            });
        }

        // ─── Leave Room ────────────────────────────────────────────────

        [HttpPost("{id}/leave")]
        public async Task<IActionResult> Leave(int id)
        {
            var userId = GetUserId();
            var member = await _db.RoomMembers
                .FirstOrDefaultAsync(m => m.RoomId == id && m.UserId == userId);

            if (member == null) return NotFound(new { error = "Not a member of this room" });
            if (member.Role == MemberRole.Host) return BadRequest(new { error = "Host cannot leave. Delete the room instead." });

            _db.RoomMembers.Remove(member);
            await _db.SaveChangesAsync();

            await _hubContext.Clients
                .Group($"room_{id}")
                .SendAsync("MemberLeft", new { userId });

            return Ok(new { message = "Left room" });
        }

        // ─── Update Progress ───────────────────────────────────────────

        [HttpPut("{id}/progress")]
        public async Task<IActionResult> UpdateProgress(int id, [FromBody] UpdateProgressRequest req)
        {
            var userId = GetUserId();

            // Verify membership
            var isMember = await _db.RoomMembers.AnyAsync(m => m.RoomId == id && m.UserId == userId);
            if (!isMember) return Forbid();

            // Verify problem belongs to room
            var problem = await _db.RoomProblems.FirstOrDefaultAsync(p => p.Id == req.RoomProblemId && p.RoomId == id);
            if (problem == null) return NotFound(new { error = "Problem not found in this room" });

            if (!Enum.TryParse<SolveStatus>(req.Status, true, out var status))
                return BadRequest(new { error = "Invalid status. Use: Unattempted, Attempted, Solved" });

            var progress = await _db.RoomProgress
                .FirstOrDefaultAsync(p => p.RoomId == id && p.UserId == userId && p.RoomProblemId == req.RoomProblemId);

            bool isNew = progress == null;
            if (isNew)
            {
                progress = new RoomProgress
                {
                    RoomId = id,
                    UserId = userId,
                    RoomProblemId = req.RoomProblemId,
                };
                _db.RoomProgress.Add(progress);
            }

            progress!.Status = status;
            progress.Attempts += 1;

            if (status == SolveStatus.Solved && progress.SolvedAt == null)
                progress.SolvedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            // Broadcast grid update
            await _hubContext.Clients
                .Group($"room_{id}")
                .SendAsync("GridUpdate", new
                {
                    userId,
                    problemId = req.RoomProblemId,
                    status = status.ToString(),
                    solvedAt = progress.SolvedAt,
                    attempts = progress.Attempts,
                });

            // If thread was just unlocked, notify
            if (status == SolveStatus.Attempted || status == SolveStatus.Solved)
            {
                await _hubContext.Clients
                    .Group($"room_{id}")
                    .SendAsync("ThreadUnlocked", new
                    {
                        userId,
                        problemId = req.RoomProblemId,
                    });
            }

            // Broadcast updated leaderboard
            await BroadcastLeaderboardAsync(id);

            return Ok(new
            {
                problemId = req.RoomProblemId,
                status = status.ToString(),
                attempts = progress.Attempts,
                solvedAt = progress.SolvedAt,
            });
        }

        // ─── Get Leaderboard ───────────────────────────────────────────

        [HttpGet("{id}/leaderboard")]
        public async Task<IActionResult> GetLeaderboard(int id)
        {
            var leaderboard = await RoomLeaderboard.BuildAsync(_db, id);
            return Ok(leaderboard);
        }

        // ─── Get Messages ─────────────────────────────────────────────

        [HttpGet("{id}/messages/{problemId}")]
        public async Task<IActionResult> GetMessages(int id, int problemId)
        {
            var userId = GetUserId();

            // Check thread lock
            var unlocked = await _lockService.IsThreadUnlockedAsync(id, userId, problemId);
            if (!unlocked)
                return Ok(new { locked = true, messages = Array.Empty<object>() });

            var messages = await _db.RoomMessages
                .Where(m => m.RoomId == id && m.RoomProblemId == problemId)
                .OrderBy(m => m.CreatedAt)
                .Include(m => m.User)
                .Select(m => new
                {
                    m.Id,
                    m.UserId,
                    DisplayName = m.User != null ? m.User.DisplayName : "",
                    ProfilePic = m.User != null ? m.User.ProfilePictureUrl : null,
                    m.Content,
                    m.CreatedAt,
                    m.ParentMessageId,
                })
                .ToListAsync();

            return Ok(new { locked = false, messages });
        }

        // ─── Post Message ─────────────────────────────────────────────

        [HttpPost("{id}/messages")]
        public async Task<IActionResult> PostMessage(int id, [FromBody] PostMessageRequest req)
        {
            var userId = GetUserId();

            // Verify membership
            var isMember = await _db.RoomMembers.AnyAsync(m => m.RoomId == id && m.UserId == userId);
            if (!isMember) return Forbid();

            // Check lock
            var (allowed, reason) = await _lockService.CanPostMessageAsync(id, userId, req.RoomProblemId);
            if (!allowed) return BadRequest(new { error = reason });

            var message = new RoomMessage
            {
                RoomId = id,
                RoomProblemId = req.RoomProblemId,
                UserId = userId,
                Content = req.Content,
                ParentMessageId = req.ParentMessageId,
            };

            _db.RoomMessages.Add(message);
            await _db.SaveChangesAsync();

            var user = await _db.Users.FindAsync(userId);

            var payload = new
            {
                messageId = message.Id,
                userId,
                displayName = user?.DisplayName ?? "",
                profilePic = user?.ProfilePictureUrl,
                problemId = req.RoomProblemId,
                content = req.Content,
                createdAt = message.CreatedAt,
                parentMessageId = req.ParentMessageId,
            };

            await _hubContext.Clients
                .Group($"room_{id}")
                .SendAsync("NewMessage", payload);

            return Ok(payload);
        }

        // ─── Room Summary ──────────────────────────────────────────────

        [HttpGet("{id}/summary")]
        public async Task<IActionResult> GetSummary(int id)
        {
            var room = await _db.Rooms
                .Include(r => r.Contest)
                .Include(r => r.Problems.OrderBy(p => p.SortOrder))
                .Include(r => r.Members).ThenInclude(m => m.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (room == null) return NotFound();

            var leaderboard = await RoomLeaderboard.BuildAsync(_db, id);

            // Per-problem solve rates
            var progress = await _db.RoomProgress.Where(p => p.RoomId == id).ToListAsync();
            var totalMembers = room.Members.Count;
            var problemStats = room.Problems.Select(prob =>
            {
                var forProblem = progress.Where(p => p.RoomProblemId == prob.Id).ToList();
                var solvedCount = forProblem.Count(p => p.Status == SolveStatus.Solved);
                var solveRate = totalMembers > 0 ? (double)solvedCount / totalMembers * 100 : 0;
                return new
                {
                    prob.Id,
                    prob.ProblemIndex,
                    prob.ProblemName,
                    solvedCount,
                    totalAttempts = forProblem.Sum(p => p.Attempts),
                    solveRate = Math.Round(solveRate, 1),
                };
            }).ToList();

            // Weakest problem (lowest solve rate)
            var weakest = problemStats.OrderBy(p => p.solveRate).FirstOrDefault();

            return Ok(new
            {
                room = new
                {
                    room.Id,
                    room.Name,
                    Status = room.Status.ToString(),
                    room.StartTime,
                    room.DurationMinutes,
                    ContestName = room.Contest?.Name,
                    ContestPlatform = room.Contest?.Platform,
                },
                leaderboard,
                problemStats,
                weakestProblem = weakest,
                members = room.Members.Select(m => new
                {
                    m.UserId,
                    DisplayName = m.User?.DisplayName ?? "",
                    ProfilePic = m.User?.ProfilePictureUrl,
                }),
            });
        }

        // ─── Helpers ───────────────────────────────────────────────────

        private async Task BroadcastLeaderboardAsync(int roomId)
        {
            var leaderboard = await RoomLeaderboard.BuildAsync(_db, roomId);
            await _hubContext.Clients
                .Group($"room_{roomId}")
                .SendAsync("LeaderboardUpdate", leaderboard);
        }
    }
}
