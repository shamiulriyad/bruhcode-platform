using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Authorize]
    public class BrainGymController : ControllerBase
    {
        private readonly AppDbContext _db;

        public BrainGymController(AppDbContext db)
        {
            _db = db;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

        // ─── DTOs ────────────────────────────────────────────────────

        public class ScoreSubmitDto
        {
            public int Correct { get; set; }
            public int Total { get; set; }
            public int BestStreak { get; set; }
        }

        // ─── Questions (kept from the old GamesController) ───────────

        /// <summary>
        /// GET /api/braingym/questions?difficulty=Mixed&count=10
        /// Returns randomized complexity questions.
        /// </summary>
        [HttpGet("api/braingym/questions")]
        public async Task<IActionResult> GetQuestions(
            [FromQuery] string difficulty = "Mixed",
            [FromQuery] int count = 10)
        {
            IQueryable<ComplexityQuestion> query = _db.ComplexityQuestions;

            if (!string.Equals(difficulty, "Mixed", StringComparison.OrdinalIgnoreCase) &&
                !string.IsNullOrWhiteSpace(difficulty))
            {
                query = query.Where(q => q.Difficulty.ToLower() == difficulty.ToLower());
            }

            var allQuestions = await query.ToListAsync();

            var rand = new Random();
            var randomized = allQuestions
                .OrderBy(_ => rand.Next())
                .Take(count)
                .Select(q => new
                {
                    q.Id,
                    q.CodeSnippet,
                    q.Language,
                    q.CorrectAnswer,
                    Options = q.Options,
                    q.Difficulty,
                    q.Explanation
                })
                .ToList();

            return Ok(randomized);
        }

        // ─── Submit Score ────────────────────────────────────────────

        /// <summary>
        /// POST /api/braingym/{gameType}/submit-score
        /// Upserts lifetime stats + inserts a history row.
        /// userId is ALWAYS read from the JWT — never from the body.
        /// </summary>
        [HttpPost("api/braingym/{gameType}/submit-score")]
        public async Task<IActionResult> SubmitScore(
            string gameType,
            [FromBody] ScoreSubmitDto dto)
        {
            var userId = GetUserId();
            if (userId == 0)
                return Unauthorized(new { error = "User not found or unauthenticated." });

            // Normalise game type key
            var normalizedType = gameType.Trim().ToLowerInvariant();

            // ── Upsert lifetime stats ──
            var score = await _db.UserGameScores
                .FirstOrDefaultAsync(s => s.UserId == userId && s.GameType == normalizedType);

            if (score == null)
            {
                score = new UserGameScore
                {
                    UserId = userId,
                    GameType = normalizedType,
                    TotalCorrect = dto.Correct,
                    TotalAttempted = dto.Total,
                    BestStreak = dto.BestStreak,
                    LastPlayedAt = DateTime.UtcNow
                };
                _db.UserGameScores.Add(score);
            }
            else
            {
                score.TotalCorrect += dto.Correct;
                score.TotalAttempted += dto.Total;
                score.BestStreak = Math.Max(score.BestStreak, dto.BestStreak);
                score.LastPlayedAt = DateTime.UtcNow;
            }

            // ── Insert history row ──
            var accuracy = dto.Total > 0
                ? Math.Round((double)dto.Correct / dto.Total * 100, 1)
                : 0;

            var sessionScore = dto.Correct * 10; // Simple scoring: 10 pts per correct

            _db.BrainGymHistory.Add(new BrainGymHistory
            {
                UserId = userId,
                GameType = normalizedType,
                Score = sessionScore,
                Accuracy = accuracy,
                PlayedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Score saved successfully.",
                stats = new
                {
                    score.TotalCorrect,
                    score.TotalAttempted,
                    score.BestStreak,
                    score.LastPlayedAt
                }
            });
        }

        // ─── My Stats ───────────────────────────────────────────────

        /// <summary>
        /// GET /api/braingym/{gameType}/my-stats
        /// Returns the logged-in user's lifetime stats for this game.
        /// </summary>
        [HttpGet("api/braingym/{gameType}/my-stats")]
        public async Task<IActionResult> GetMyStats(string gameType)
        {
            var userId = GetUserId();
            if (userId == 0)
                return Unauthorized();

            var normalizedType = gameType.Trim().ToLowerInvariant();

            var stats = await _db.UserGameScores
                .FirstOrDefaultAsync(s => s.UserId == userId && s.GameType == normalizedType);

            if (stats == null)
            {
                return Ok(new
                {
                    gameType = normalizedType,
                    totalCorrect = 0,
                    totalAttempted = 0,
                    bestStreak = 0,
                    accuracy = 0.0,
                    lastPlayedAt = (DateTime?)null
                });
            }

            var accuracy = stats.TotalAttempted > 0
                ? Math.Round((double)stats.TotalCorrect / stats.TotalAttempted * 100, 1)
                : 0;

            return Ok(new
            {
                gameType = stats.GameType,
                totalCorrect = stats.TotalCorrect,
                totalAttempted = stats.TotalAttempted,
                bestStreak = stats.BestStreak,
                accuracy,
                lastPlayedAt = stats.LastPlayedAt
            });
        }

        // ─── Leaderboard ────────────────────────────────────────────

        /// <summary>
        /// GET /api/braingym/{gameType}/leaderboard?top=20
        /// Returns top players by accuracy (min 5 attempts) joined with user info.
        /// </summary>
        [HttpGet("api/braingym/{gameType}/leaderboard")]
        public async Task<IActionResult> GetLeaderboard(
            string gameType,
            [FromQuery] int top = 20)
        {
            var normalizedType = gameType.Trim().ToLowerInvariant();
            var currentUserId = GetUserId();

            var leaders = await _db.UserGameScores
                .Where(s => s.GameType == normalizedType && s.TotalAttempted >= 5)
                .OrderByDescending(s => (double)s.TotalCorrect / s.TotalAttempted)
                .ThenByDescending(s => s.BestStreak)
                .ThenByDescending(s => s.TotalCorrect)
                .Take(Math.Clamp(top, 1, 100))
                .Join(
                    _db.Users,
                    s => s.UserId,
                    u => u.Id,
                    (s, u) => new
                    {
                        userId = u.Id,
                        username = u.Username ?? u.DisplayName,
                        displayName = u.DisplayName,
                        profilePictureUrl = u.ProfilePictureUrl,
                        totalCorrect = s.TotalCorrect,
                        totalAttempted = s.TotalAttempted,
                        bestStreak = s.BestStreak,
                        accuracy = s.TotalAttempted > 0
                            ? Math.Round((double)s.TotalCorrect / s.TotalAttempted * 100, 1)
                            : 0,
                        lastPlayedAt = s.LastPlayedAt,
                        isCurrentUser = u.Id == currentUserId
                    })
                .ToListAsync();

            return Ok(leaders);
        }

        /// <summary>
        /// GET /api/braingym/overview
        /// Returns a consolidated overview of all game stats and play history for the logged-in user.
        /// </summary>
        [HttpGet("api/braingym/overview")]
        public async Task<IActionResult> GetOverview()
        {
            var userId = GetUserId();
            if (userId == 0) return Unauthorized();

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found");

            // Fetch game stats
            var gameStats = await _db.UserGameScores
                .Where(s => s.UserId == userId)
                .Select(s => new
                {
                    gameType = s.GameType,
                    totalCorrect = s.TotalCorrect,
                    totalAttempted = s.TotalAttempted,
                    bestStreak = s.BestStreak,
                    accuracy = s.TotalAttempted > 0
                        ? Math.Round((double)s.TotalCorrect / s.TotalAttempted * 100, 1)
                        : 0,
                    lastPlayedAt = s.LastPlayedAt
                })
                .ToListAsync();

            // Calculate overall metrics
            var totalGamesPlayed = await _db.BrainGymHistory
                .Where(h => h.UserId == userId)
                .CountAsync();

            // Overall accuracy across all games
            var sumCorrect = gameStats.Sum(s => s.totalCorrect);
            var sumAttempted = gameStats.Sum(s => s.totalAttempted);
            var overallAccuracy = sumAttempted > 0
                ? Math.Round((double)sumCorrect / sumAttempted * 100, 1)
                : 0;

            // Max best streak across all games
            var maxBestStreak = gameStats.Any() ? gameStats.Max(s => s.bestStreak) : 0;

            // Fetch recent 20 play history entries
            var history = await _db.BrainGymHistory
                .Where(h => h.UserId == userId)
                .OrderByDescending(h => h.PlayedAt)
                .Take(20)
                .Select(h => new
                {
                    h.Id,
                    h.GameType,
                    h.Score,
                    h.Accuracy,
                    h.PlayedAt
                })
                .ToListAsync();

            return Ok(new
            {
                user = new
                {
                    id = user.Id,
                    displayName = user.DisplayName,
                    username = user.Username,
                    profilePictureUrl = user.ProfilePictureUrl,
                    email = user.Email
                },
                overallStats = new
                {
                    totalGamesPlayed,
                    overallAccuracy,
                    bestStreak = maxBestStreak,
                    totalCorrect = sumCorrect,
                    totalAttempted = sumAttempted
                },
                gameStats,
                history
            });
        }

        /// <summary>
        /// GET /api/braingym/{gameType}/my-rank
        /// Returns the logged-in user's leaderboard rank position for the specified game type.
        /// </summary>
        [HttpGet("api/braingym/{gameType}/my-rank")]
        public async Task<IActionResult> GetMyRank(string gameType)
        {
            var userId = GetUserId();
            if (userId == 0) return Unauthorized();

            var normalizedType = gameType.Trim().ToLowerInvariant();

            var scores = await _db.UserGameScores
                .Where(s => s.GameType == normalizedType)
                .OrderByDescending(s => s.TotalAttempted > 0 ? (double)s.TotalCorrect / s.TotalAttempted : 0)
                .ThenByDescending(s => s.BestStreak)
                .ThenByDescending(s => s.TotalCorrect)
                .Select(s => s.UserId)
                .ToListAsync();

            var index = scores.IndexOf(userId);
            var rank = index >= 0 ? index + 1 : 0;

            return Ok(new
            {
                gameType = normalizedType,
                rank,
                totalPlayers = scores.Count
            });
        }
    }
}
