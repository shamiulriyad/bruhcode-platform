using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests
{
    public class ThreadLockServiceTests
    {
        private static AppDbContext CreateInMemoryDb()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        private static async Task<(AppDbContext db, int roomId, int userId, int problemId)> SeedTestDataAsync()
        {
            var db = CreateInMemoryDb();

            var contest = new Contest
            {
                Name = "Test Contest",
                Platform = "Codeforces",
                StartTime = DateTime.UtcNow.AddHours(-2),
                Duration = 120,
                Url = "https://codeforces.com/contest/1"
            };
            db.Contests.Add(contest);

            var user = new UserAccount
            {
                DisplayName = "TestUser",
                Email = "test@test.com",
                PasswordHash = "hash"
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();

            var room = new Room
            {
                Name = "Test Room",
                ContestId = contest.Id,
                HostId = user.Id,
                StartTime = DateTime.UtcNow.AddMinutes(-30),
                DurationMinutes = 120,
                Status = RoomStatus.Live,
                InviteCode = "TESTCODE",
            };
            db.Rooms.Add(room);
            await db.SaveChangesAsync();

            var problem = new RoomProblem
            {
                RoomId = room.Id,
                ProblemIndex = "A",
                ProblemName = "Test Problem",
                ProblemUrl = "https://example.com/a",
                SortOrder = 0,
            };
            db.RoomProblems.Add(problem);

            db.RoomMembers.Add(new RoomMember
            {
                RoomId = room.Id,
                UserId = user.Id,
                Role = MemberRole.Host,
            });

            await db.SaveChangesAsync();

            return (db, room.Id, user.Id, problem.Id);
        }

        [Fact]
        public async Task Thread_Locked_WhenUserHasNotAttempted()
        {
            var (db, roomId, userId, problemId) = await SeedTestDataAsync();
            var service = new ThreadLockService(db);

            var unlocked = await service.IsThreadUnlockedAsync(roomId, userId, problemId);

            Assert.False(unlocked);
        }

        [Fact]
        public async Task Thread_Unlocked_WhenUserMarkedSolved()
        {
            var (db, roomId, userId, problemId) = await SeedTestDataAsync();

            db.RoomProgress.Add(new RoomProgress
            {
                RoomId = roomId,
                UserId = userId,
                RoomProblemId = problemId,
                Status = SolveStatus.Solved,
                SolvedAt = DateTime.UtcNow,
                Attempts = 1,
            });
            await db.SaveChangesAsync();

            var service = new ThreadLockService(db);
            var unlocked = await service.IsThreadUnlockedAsync(roomId, userId, problemId);

            Assert.True(unlocked);
        }

        [Fact]
        public async Task Thread_Unlocked_WhenUserMarkedAttempted()
        {
            var (db, roomId, userId, problemId) = await SeedTestDataAsync();

            db.RoomProgress.Add(new RoomProgress
            {
                RoomId = roomId,
                UserId = userId,
                RoomProblemId = problemId,
                Status = SolveStatus.Attempted,
                Attempts = 1,
            });
            await db.SaveChangesAsync();

            var service = new ThreadLockService(db);
            var unlocked = await service.IsThreadUnlockedAsync(roomId, userId, problemId);

            Assert.True(unlocked);
        }

        [Fact]
        public async Task Thread_Unlocked_WhenRoomEnded()
        {
            var (db, roomId, userId, problemId) = await SeedTestDataAsync();

            // Set room to Ended
            var room = await db.Rooms.FindAsync(roomId);
            room!.Status = RoomStatus.Ended;
            await db.SaveChangesAsync();

            var service = new ThreadLockService(db);
            // Even without any progress, thread should be unlocked
            var unlocked = await service.IsThreadUnlockedAsync(roomId, userId, problemId);

            Assert.True(unlocked);
        }

        [Fact]
        public async Task Thread_Locked_DuringLiveRoom_ForNonAttemptedProblem()
        {
            var (db, roomId, userId, problemId) = await SeedTestDataAsync();

            // Add a progress for a DIFFERENT problem (solved), but not for this one
            var otherProblem = new RoomProblem
            {
                RoomId = roomId,
                ProblemIndex = "B",
                ProblemName = "Other Problem",
                ProblemUrl = "https://example.com/b",
                SortOrder = 1,
            };
            db.RoomProblems.Add(otherProblem);
            await db.SaveChangesAsync();

            db.RoomProgress.Add(new RoomProgress
            {
                RoomId = roomId,
                UserId = userId,
                RoomProblemId = otherProblem.Id,
                Status = SolveStatus.Solved,
                SolvedAt = DateTime.UtcNow,
                Attempts = 1,
            });
            await db.SaveChangesAsync();

            var service = new ThreadLockService(db);
            // Problem A should still be locked even though Problem B is solved
            var unlocked = await service.IsThreadUnlockedAsync(roomId, userId, problemId);

            Assert.False(unlocked);
        }

        [Fact]
        public async Task Message_Rejected_WhenThreadLocked()
        {
            var (db, roomId, userId, problemId) = await SeedTestDataAsync();
            var service = new ThreadLockService(db);

            var (allowed, reason) = await service.CanPostMessageAsync(roomId, userId, problemId);

            Assert.False(allowed);
            Assert.Contains("locked", reason, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Message_Accepted_WhenThreadUnlocked()
        {
            var (db, roomId, userId, problemId) = await SeedTestDataAsync();

            db.RoomProgress.Add(new RoomProgress
            {
                RoomId = roomId,
                UserId = userId,
                RoomProblemId = problemId,
                Status = SolveStatus.Solved,
                SolvedAt = DateTime.UtcNow,
                Attempts = 1,
            });
            await db.SaveChangesAsync();

            var service = new ThreadLockService(db);
            var (allowed, _) = await service.CanPostMessageAsync(roomId, userId, problemId);

            Assert.True(allowed);
        }

        [Fact]
        public async Task GeneralChat_AlwaysAllowed()
        {
            var (db, roomId, userId, _) = await SeedTestDataAsync();
            var service = new ThreadLockService(db);

            // null problemId = general chat
            var (allowed, _) = await service.CanPostMessageAsync(roomId, userId, null);

            Assert.True(allowed);
        }
    }
}
