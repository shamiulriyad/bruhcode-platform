using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
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
    public class GameController : ControllerBase
    {
        private readonly AppDbContext _db;

        public GameController(AppDbContext db)
        {
            _db = db;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

        public class ScoreSubmitDto
        {
            public int Correct { get; set; }
            public int Total { get; set; }
            public int BestStreak { get; set; }
        }

        /// <summary>
        /// GET /api/games
        /// Lists active games grouped by category.
        /// </summary>
        [HttpGet("api/games")]
        public async Task<IActionResult> GetGames()
        {
            var games = await _db.Games
                .Where(g => g.IsActive)
                .Select(g => new
                {
                    g.Id,
                    g.GameKey,
                    g.Name,
                    g.Category,
                    g.Description,
                    g.IconKey,
                    g.IsActive
                })
                .ToListAsync();

            var grouped = games
                .GroupBy(g => g.Category)
                .ToDictionary(grp => grp.Key, grp => grp.ToList());

            return Ok(grouped);
        }

        /// <summary>
        /// GET /api/games/{gameKey}/questions?difficulty=Mixed&count=10
        /// Returns randomized game-specific questions.
        /// </summary>
        [HttpGet("api/games/{gameKey}/questions")]
        public async Task<IActionResult> GetQuestions(
            string gameKey,
            [FromQuery] string difficulty = "Mixed",
            [FromQuery] int count = 10)
        {
            var game = await _db.Games.FirstOrDefaultAsync(g => g.GameKey == gameKey && g.IsActive);
            if (game == null)
                return NotFound(new { error = "Game not found or inactive." });

            IQueryable<GameQuestion> query = _db.GameQuestions.Where(q => q.GameId == game.Id);

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
                .Select(q =>
                {
                    var responseObj = new Dictionary<string, object>
                    {
                        { "id", q.Id },
                        { "gameId", q.GameId },
                        { "difficulty", q.Difficulty }
                    };

                    try
                    {
                        var contentDict = JsonSerializer.Deserialize<Dictionary<string, object>>(q.Content);
                        if (contentDict != null)
                        {
                            foreach (var kvp in contentDict)
                            {
                                // Handle optionsRaw conversion for options selection
                                if (kvp.Key == "optionsRaw" && kvp.Value != null)
                                {
                                    var rawString = kvp.Value.ToString();
                                    if (rawString != null)
                                    {
                                        responseObj["options"] = rawString.Split(';', StringSplitOptions.RemoveEmptyEntries);
                                    }
                                }
                                
                                responseObj[kvp.Key] = kvp.Value;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        // Fallback in case of JSON parse error
                        responseObj["error"] = "Failed to parse question content: " + ex.Message;
                    }

                    return responseObj;
                })
                .ToList();

            return Ok(randomized);
        }

        /// <summary>
        /// POST /api/games/{gameKey}/submit-score
        /// Saves score and history logs for a game.
        /// </summary>
        [HttpPost("api/games/{gameKey}/submit-score")]
        public async Task<IActionResult> SubmitScore(
            string gameKey,
            [FromBody] ScoreSubmitDto dto)
        {
            var userId = GetUserId();
            if (userId == 0)
                return Unauthorized(new { error = "User not found or unauthenticated." });

            var game = await _db.Games.FirstOrDefaultAsync(g => g.GameKey == gameKey && g.IsActive);
            if (game == null)
                return NotFound(new { error = "Game not found or inactive." });

            // ── Upsert lifetime stats ──
            var score = await _db.UserGameScores
                .FirstOrDefaultAsync(s => s.UserId == userId && s.GameId == game.Id);

            if (score == null)
            {
                score = new UserGameScore
                {
                    UserId = userId,
                    GameId = game.Id,
                    GameType = game.GameKey,
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

            var sessionScore = dto.Correct * 10;

            _db.BrainGymHistory.Add(new BrainGymHistory
            {
                UserId = userId,
                GameId = game.Id,
                GameType = game.GameKey,
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
                    totalCorrect = score.TotalCorrect,
                    totalAttempted = score.TotalAttempted,
                    bestStreak = score.BestStreak,
                    lastPlayedAt = score.LastPlayedAt
                }
            });
        }

        /// <summary>
        /// GET /api/games/{gameKey}/my-stats
        /// Returns specific game stats for the current user.
        /// </summary>
        [HttpGet("api/games/{gameKey}/my-stats")]
        public async Task<IActionResult> GetMyStats(string gameKey)
        {
            var userId = GetUserId();
            var game = await _db.Games.FirstOrDefaultAsync(g => g.GameKey == gameKey);
            if (game == null)
                return NotFound(new { error = "Game not found." });

            var stats = await _db.UserGameScores
                .Where(s => s.UserId == userId && s.GameId == game.Id)
                .Select(s => new
                {
                    s.TotalCorrect,
                    s.TotalAttempted,
                    s.BestStreak,
                    accuracy = s.TotalAttempted > 0 ? Math.Round((double)s.TotalCorrect / s.TotalAttempted * 100, 1) : 0,
                    s.LastPlayedAt
                })
                .FirstOrDefaultAsync();

            if (stats == null)
            {
                return Ok(new
                {
                    totalCorrect = 0,
                    totalAttempted = 0,
                    bestStreak = 0,
                    accuracy = 0.0,
                    lastPlayedAt = (DateTime?)null
                });
            }

            return Ok(stats);
        }

        /// <summary>
        /// GET /api/games/{gameKey}/leaderboard
        /// Returns global leaderboard rankings for a specific game.
        /// </summary>
        [HttpGet("api/games/{gameKey}/leaderboard")]
        public async Task<IActionResult> GetLeaderboard(string gameKey, [FromQuery] int top = 20)
        {
            var userId = GetUserId();
            var game = await _db.Games.FirstOrDefaultAsync(g => g.GameKey == gameKey);
            if (game == null)
                return NotFound(new { error = "Game not found." });

            var leaders = await _db.UserGameScores
                .Where(s => s.GameId == game.Id)
                .Include(s => s.User)
                .OrderByDescending(s => s.TotalCorrect)
                .ThenByDescending(s => s.BestStreak)
                .Select(s => new
                {
                    userId = s.UserId,
                    username = s.User!.Username ?? s.User.DisplayName,
                    displayName = s.User.DisplayName,
                    profilePictureUrl = s.User.ProfilePictureUrl,
                    totalCorrect = s.TotalCorrect,
                    totalAttempted = s.TotalAttempted,
                    bestStreak = s.BestStreak,
                    accuracy = s.TotalAttempted > 0 ? Math.Round((double)s.TotalCorrect / s.TotalAttempted * 100, 1) : 0,
                    lastPlayedAt = s.LastPlayedAt,
                    isCurrentUser = s.UserId == userId
                })
                .Take(top)
                .ToListAsync();

            return Ok(leaders);
        }

        /// <summary>
        /// GET /api/games/{gameKey}/my-rank
        /// Returns current user's global rank details for a specific game.
        /// </summary>
        [HttpGet("api/games/{gameKey}/my-rank")]
        public async Task<IActionResult> GetMyRank(string gameKey)
        {
            var userId = GetUserId();
            var game = await _db.Games.FirstOrDefaultAsync(g => g.GameKey == gameKey);
            if (game == null)
                return NotFound(new { error = "Game not found." });

            var userScore = await _db.UserGameScores
                .FirstOrDefaultAsync(s => s.UserId == userId && s.GameId == game.Id);

            if (userScore == null)
            {
                return Ok(new { rank = "-", totalPlayers = 0 });
            }

            var totalPlayers = await _db.UserGameScores.CountAsync(s => s.GameId == game.Id);
            var betterPlayers = await _db.UserGameScores
                .CountAsync(s => s.GameId == game.Id && (
                    s.TotalCorrect > userScore.TotalCorrect || 
                    (s.TotalCorrect == userScore.TotalCorrect && s.BestStreak > userScore.BestStreak)
                ));

            return Ok(new
            {
                rank = (betterPlayers + 1).ToString(),
                totalPlayers
            });
        }

        /// <summary>
        /// GET /api/games/overview
        /// Consolidated metrics overview across all logic games for the logged-in user.
        /// </summary>
        [HttpGet("api/games/overview")]
        public async Task<IActionResult> GetOverview()
        {
            var userId = GetUserId();
            if (userId == 0)
                return Unauthorized(new { error = "User not found or unauthenticated." });

            var user = await _db.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { error = "User not found." });

            var gameStats = await _db.UserGameScores
                .Where(s => s.UserId == userId)
                .Include(s => s.Game)
                .Select(s => new
                {
                    gameId = s.GameId,
                    gameKey = s.Game!.GameKey,
                    gameName = s.Game.Name,
                    totalCorrect = s.TotalCorrect,
                    totalAttempted = s.TotalAttempted,
                    bestStreak = s.BestStreak,
                    accuracy = s.TotalAttempted > 0 ? Math.Round((double)s.TotalCorrect / s.TotalAttempted * 100, 1) : 0,
                    lastPlayedAt = s.LastPlayedAt
                })
                .ToListAsync();

            var totalGamesPlayed = await _db.BrainGymHistory
                .CountAsync(h => h.UserId == userId);

            var sumCorrect = gameStats.Sum(s => s.totalCorrect);
            var sumAttempted = gameStats.Sum(s => s.totalAttempted);
            var overallAccuracy = sumAttempted > 0
                ? Math.Round((double)sumCorrect / sumAttempted * 100, 1)
                : 0;

            var maxBestStreak = gameStats.Any() ? gameStats.Max(s => s.bestStreak) : 0;

            var history = await _db.BrainGymHistory
                .Where(h => h.UserId == userId)
                .Include(h => h.Game)
                .OrderByDescending(h => h.PlayedAt)
                .Take(20)
                .Select(h => new
                {
                    h.Id,
                    gameId = h.GameId,
                    gameKey = h.Game!.GameKey,
                    gameName = h.Game.Name,
                    score = h.Score,
                    accuracy = h.Accuracy,
                    playedAt = h.PlayedAt
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
    }
}
