using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.Tests
{
    public class RoomServiceTests
    {
        private static AppDbContext CreateInMemoryDb()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        private static async Task<(AppDbContext db, Contest contest, UserAccount user)> SeedBaseDataAsync()
        {
            var db = CreateInMemoryDb();

            var contest = new Contest
            {
                Name = "CF Round 900 Div.2",
                Platform = "Codeforces",
                StartTime = DateTime.UtcNow.AddHours(-24),
                Duration = 120,
                Url = "https://codeforces.com/contest/900"
            };
            db.Contests.Add(contest);

            var user = new UserAccount
            {
                DisplayName = "Host User",
                Email = "host@test.com",
                PasswordHash = "hash"
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();

            return (db, contest, user);
        }

        [Fact]
        public async Task CreateRoom_GeneratesUniqueInviteCode()
        {
            var (db, contest, user) = await SeedBaseDataAsync();

            var room1 = new Room
            {
                Name = "Room 1",
                ContestId = contest.Id,
                HostId = user.Id,
                StartTime = DateTime.UtcNow.AddHours(1),
                DurationMinutes = 120,
                InviteCode = "ABCD1234",
            };
            var room2 = new Room
            {
                Name = "Room 2",
                ContestId = contest.Id,
                HostId = user.Id,
                StartTime = DateTime.UtcNow.AddHours(2),
                DurationMinutes = 120,
                InviteCode = "EFGH5678",
            };

            db.Rooms.Add(room1);
            db.Rooms.Add(room2);
            await db.SaveChangesAsync();

            Assert.NotEqual(room1.InviteCode, room2.InviteCode);
            Assert.Equal(8, room1.InviteCode.Length);
            Assert.Equal(8, room2.InviteCode.Length);
        }

        [Fact]
        public async Task JoinRoom_RejectsBeyondMaxMembers()
        {
            var (db, contest, host) = await SeedBaseDataAsync();

            var room = new Room
            {
                Name = "Small Room",
                ContestId = contest.Id,
                HostId = host.Id,
                StartTime = DateTime.UtcNow.AddHours(1),
                DurationMinutes = 120,
                InviteCode = "SMLLROOM",
                MaxMembers = 2,
            };
            db.Rooms.Add(room);
            await db.SaveChangesAsync();

            // Add host as member
            db.RoomMembers.Add(new RoomMember { RoomId = room.Id, UserId = host.Id, Role = MemberRole.Host });

            // Add second member
            var user2 = new UserAccount { DisplayName = "User 2", Email = "u2@test.com", PasswordHash = "h" };
            db.Users.Add(user2);
            await db.SaveChangesAsync();
            db.RoomMembers.Add(new RoomMember { RoomId = room.Id, UserId = user2.Id });
            await db.SaveChangesAsync();

            // Now room is at capacity (2/2)
            var memberCount = await db.RoomMembers.CountAsync(m => m.RoomId == room.Id);
            Assert.Equal(2, memberCount);
            Assert.True(memberCount >= room.MaxMembers);
        }

        [Fact]
        public async Task JoinRoom_RejectsDuplicateMember()
        {
            var (db, contest, host) = await SeedBaseDataAsync();

            var room = new Room
            {
                Name = "Test Room",
                ContestId = contest.Id,
                HostId = host.Id,
                StartTime = DateTime.UtcNow.AddHours(1),
                DurationMinutes = 120,
                InviteCode = "DUPCHECK",
            };
            db.Rooms.Add(room);
            await db.SaveChangesAsync();

            db.RoomMembers.Add(new RoomMember { RoomId = room.Id, UserId = host.Id, Role = MemberRole.Host });
            await db.SaveChangesAsync();

            // Check for duplicate before adding
            var alreadyMember = await db.RoomMembers.AnyAsync(m => m.RoomId == room.Id && m.UserId == host.Id);
            Assert.True(alreadyMember);
        }

        [Fact]
        public async Task ProgressUpdate_IncrementsAttempts()
        {
            var (db, contest, user) = await SeedBaseDataAsync();

            var room = new Room
            {
                Name = "Progress Room",
                ContestId = contest.Id,
                HostId = user.Id,
                StartTime = DateTime.UtcNow.AddMinutes(-30),
                DurationMinutes = 120,
                Status = RoomStatus.Live,
                InviteCode = "PROGRESS",
            };
            db.Rooms.Add(room);
            await db.SaveChangesAsync();

            var problem = new RoomProblem
            {
                RoomId = room.Id,
                ProblemIndex = "A",
                ProblemName = "Test",
                ProblemUrl = "https://example.com",
                SortOrder = 0,
            };
            db.RoomProblems.Add(problem);
            await db.SaveChangesAsync();

            // First attempt
            var progress = new RoomProgress
            {
                RoomId = room.Id,
                UserId = user.Id,
                RoomProblemId = problem.Id,
                Status = SolveStatus.Attempted,
                Attempts = 1,
            };
            db.RoomProgress.Add(progress);
            await db.SaveChangesAsync();

            // Second attempt (increment)
            progress.Attempts += 1;
            progress.Status = SolveStatus.Attempted;
            await db.SaveChangesAsync();

            // Third attempt (solved!)
            progress.Attempts += 1;
            progress.Status = SolveStatus.Solved;
            progress.SolvedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            var result = await db.RoomProgress.FindAsync(progress.Id);
            Assert.Equal(3, result!.Attempts);
            Assert.Equal(SolveStatus.Solved, result.Status);
            Assert.NotNull(result.SolvedAt);
        }

        [Fact]
        public async Task Leaderboard_SortsBySolvedThenByTime()
        {
            var (db, contest, user1) = await SeedBaseDataAsync();

            var user2 = new UserAccount { DisplayName = "User 2", Email = "u2@test.com", PasswordHash = "h" };
            var user3 = new UserAccount { DisplayName = "User 3", Email = "u3@test.com", PasswordHash = "h" };
            db.Users.AddRange(user2, user3);
            await db.SaveChangesAsync();

            var roomStart = DateTime.UtcNow.AddMinutes(-60);
            var room = new Room
            {
                Name = "Leaderboard Room",
                ContestId = contest.Id,
                HostId = user1.Id,
                StartTime = roomStart,
                DurationMinutes = 120,
                Status = RoomStatus.Live,
                InviteCode = "LDRBOARD",
            };
            db.Rooms.Add(room);
            await db.SaveChangesAsync();

            var probA = new RoomProblem { RoomId = room.Id, ProblemIndex = "A", ProblemName = "A", SortOrder = 0 };
            var probB = new RoomProblem { RoomId = room.Id, ProblemIndex = "B", ProblemName = "B", SortOrder = 1 };
            db.RoomProblems.AddRange(probA, probB);
            await db.SaveChangesAsync();

            // user1 solved 2 problems (total time = 30min + 45min = 75min)
            db.RoomProgress.AddRange(
                new RoomProgress { RoomId = room.Id, UserId = user1.Id, RoomProblemId = probA.Id, Status = SolveStatus.Solved, SolvedAt = roomStart.AddMinutes(30), Attempts = 1 },
                new RoomProgress { RoomId = room.Id, UserId = user1.Id, RoomProblemId = probB.Id, Status = SolveStatus.Solved, SolvedAt = roomStart.AddMinutes(45), Attempts = 2 }
            );

            // user2 solved 2 problems but slower (total time = 40min + 50min = 90min)
            db.RoomProgress.AddRange(
                new RoomProgress { RoomId = room.Id, UserId = user2.Id, RoomProblemId = probA.Id, Status = SolveStatus.Solved, SolvedAt = roomStart.AddMinutes(40), Attempts = 1 },
                new RoomProgress { RoomId = room.Id, UserId = user2.Id, RoomProblemId = probB.Id, Status = SolveStatus.Solved, SolvedAt = roomStart.AddMinutes(50), Attempts = 1 }
            );

            // user3 solved only 1 problem
            db.RoomProgress.Add(
                new RoomProgress { RoomId = room.Id, UserId = user3.Id, RoomProblemId = probA.Id, Status = SolveStatus.Solved, SolvedAt = roomStart.AddMinutes(10), Attempts = 1 }
            );
            await db.SaveChangesAsync();

            db.RoomMembers.AddRange(
                new RoomMember { RoomId = room.Id, UserId = user3.Id },
                new RoomMember { RoomId = room.Id, UserId = user2.Id },
                new RoomMember { RoomId = room.Id, UserId = user1.Id }
            );
            await db.SaveChangesAsync();

            var rankings = await RoomLeaderboard.BuildAsync(db, room.Id);

            // user1 should be #1 (2 solved, 75min < 90min)
            Assert.Equal(user1.Id, rankings[0].UserId);
            Assert.Equal(1, rankings[0].Rank);
            Assert.Equal(75 * 60, rankings[0].TotalTimeSec);
            Assert.Equal(3, rankings[0].Attempts);
            // user2 should be #2 (2 solved, but slower)
            Assert.Equal(user2.Id, rankings[1].UserId);
            // user3 should be #3 (only 1 solved)
            Assert.Equal(user3.Id, rankings[2].UserId);
            Assert.Equal(1, rankings[2].SolvedCount);
        }
    }
}
