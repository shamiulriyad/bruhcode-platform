using System.Security.Claims;
using System.Text.Json;
using Backend.Controllers;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests
{
    public class GameLeaderboardTests
    {
        private static AppDbContext CreateInMemoryDb() =>
            new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

        private static GameController ControllerFor(AppDbContext db, int userId) => new(db)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) }, "test")),
                },
            },
        };

        // Seeds one game and a player per (name, correct, attempted, streak) tuple; returns user ids by name
        private static async Task<(AppDbContext db, Dictionary<string, int> ids)> SeedAsync(params (string name, int correct, int attempted, int streak)[] players)
        {
            var db = CreateInMemoryDb();
            var game = new Game { GameKey = "complexity_guess", Name = "Complexity Quiz", Category = "Speed", Description = "", IconKey = "c" };
            db.Games.Add(game);
            await db.SaveChangesAsync();

            var ids = new Dictionary<string, int>();
            foreach (var (name, correct, attempted, streak) in players)
            {
                var user = new UserAccount { DisplayName = name, Username = name, Email = $"{name}@test.com", PasswordHash = "h" };
                db.Users.Add(user);
                await db.SaveChangesAsync();
                db.UserGameScores.Add(new UserGameScore { UserId = user.Id, GameId = game.Id, GameType = game.GameKey, TotalCorrect = correct, TotalAttempted = attempted, BestStreak = streak });
                ids[name] = user.Id;
            }
            await db.SaveChangesAsync();
            return (db, ids);
        }

        private static JsonElement Json(IActionResult result) =>
            JsonSerializer.SerializeToElement(Assert.IsType<OkObjectResult>(result).Value);

        [Fact]
        public async Task Leaderboard_RanksByAccuracy_ThenCorrect_AndSkipsPlayersBelowMinimum()
        {
            var (db, ids) = await SeedAsync(
                ("lucky", 5, 5, 5),        // 100% but only 5 questions → not ranked
                ("steady", 27, 30, 6),     // 90%
                ("sharp", 19, 20, 9),      // 95% → first
                ("same90", 18, 20, 4),     // 90%, fewer correct than "steady"
                ("grinder", 60, 100, 8));  // 60% despite most correct answers

            var board = Json(await ControllerFor(db, ids["sharp"]).GetLeaderboard("complexity_guess"));
            var order = board.EnumerateArray().Select(e => e.GetProperty("username").GetString()).ToList();

            Assert.Equal(new[] { "sharp", "steady", "same90", "grinder" }, order);
        }

        [Fact]
        public async Task MyRank_MatchesLeaderboardPosition()
        {
            var (db, ids) = await SeedAsync(("sharp", 19, 20, 9), ("steady", 27, 30, 6), ("same90", 18, 20, 4), ("grinder", 60, 100, 8));

            var rank = Json(await ControllerFor(db, ids["same90"]).GetMyRank("complexity_guess"));

            Assert.Equal("3", rank.GetProperty("rank").GetString());
            Assert.Equal(4, rank.GetProperty("totalPlayers").GetInt32());
        }

        [Fact]
        public async Task MyRank_ReportsQuestionsNeeded_WhenBelowMinimum()
        {
            var (db, ids) = await SeedAsync(("sharp", 19, 20, 9), ("newbie", 7, 10, 7));

            var rank = Json(await ControllerFor(db, ids["newbie"]).GetMyRank("complexity_guess"));

            Assert.Equal("-", rank.GetProperty("rank").GetString());
            Assert.Equal(1, rank.GetProperty("totalPlayers").GetInt32());
            Assert.Equal(10, rank.GetProperty("questionsNeeded").GetInt32());
        }
    }
}
