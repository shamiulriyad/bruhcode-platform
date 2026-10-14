using Backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public StatsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var now = DateTime.UtcNow;

            var lifetimeContests = await _db.GlobalContestStats
                .Where(s => s.Id == 1)
                .Select(s => (long?)s.LifetimeContestCount)
                .FirstOrDefaultAsync() ?? await _db.Contests.LongCountAsync();

            var totalContests = lifetimeContests;
            var totalPlatforms = await _db.Contests.Select(c => c.Platform).Distinct().CountAsync();
            var upcomingContests = await _db.Contests.Where(c => c.StartTime >= now).CountAsync();
            var totalUsers = await _db.Users.LongCountAsync();

            var lastUpdated = await _db.Contests.MaxAsync(c => (DateTime?)c.CreatedAt);

            var platformCounts = await _db.PlatformContestStats
                .Select(s => new { Platform = s.Platform, Count = s.LifetimeContestCount })
                .OrderByDescending(s => s.Count)
                .ThenBy(s => s.Platform)
                .ToListAsync();

            if (platformCounts.Count == 0)
            {
                platformCounts = await _db.Contests
                    .GroupBy(c => c.Platform)
                    .Select(g => new { Platform = g.Key, Count = (long)g.Count() })
                    .OrderByDescending(s => s.Count)
                    .ThenBy(s => s.Platform)
                    .ToListAsync();
            }

            return Ok(new {
                totalContests,
                lifetimeContests,
                totalPlatforms,
                upcomingContests,
                totalUsers,
                lastUpdated,
                platformCounts
            });
        }

        [HttpGet("universities")]
        public async Task<IActionResult> GetUniversities()
        {
            var universities = await _db.Users
                .Where(u => !string.IsNullOrEmpty(u.University))
                .GroupBy(u => u.University!)
                .Select(g => new { University = g.Key, Count = g.LongCount() })
                .OrderByDescending(x => x.Count)
                .ThenBy(x => x.University)
                .ToListAsync();

            return Ok(universities);
        }

        [HttpGet("platform-usage")]
        public async Task<IActionResult> GetPlatformUsage()
        {
            var codeforces = await _db.Users.Where(u => !string.IsNullOrEmpty(u.CodeforceHandle)).LongCountAsync();
            var leetcode = await _db.Users.Where(u => !string.IsNullOrEmpty(u.LeetcodeUsername)).LongCountAsync();
            var hackerRank = await _db.Users.Where(u => !string.IsNullOrEmpty(u.HackerRankHandle)).LongCountAsync();
            var codechef = await _db.Users.Where(u => !string.IsNullOrEmpty(u.CodeChefHandle)).LongCountAsync();
            var atcoder = await _db.Users.Where(u => !string.IsNullOrEmpty(u.AtCoderHandle)).LongCountAsync();
            var github = await _db.Users.Where(u => !string.IsNullOrEmpty(u.GithubUsername)).LongCountAsync();

            return Ok(new {
                codeforces,
                leetcode,
                hackerRank,
                codechef,
                atcoder,
                github
            });
        }

        [HttpGet("members")]
        public async Task<IActionResult> GetMembers([FromQuery] string? university, [FromQuery] string? platform, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 24)
        {
            var q = _db.Users.AsQueryable();

            if (!string.IsNullOrEmpty(university)) q = q.Where(u => u.University == university);

            if (!string.IsNullOrEmpty(platform))
            {
                switch (platform.ToLower())
                {
                    case "codeforces": q = q.Where(u => !string.IsNullOrEmpty(u.CodeforceHandle)); break;
                    case "leetcode": q = q.Where(u => !string.IsNullOrEmpty(u.LeetcodeUsername)); break;
                    case "github": q = q.Where(u => !string.IsNullOrEmpty(u.GithubUsername)); break;
                    case "hacker_rank": q = q.Where(u => !string.IsNullOrEmpty(u.HackerRankHandle)); break;
                    default: break;
                }
            }

            if (!string.IsNullOrEmpty(search))
            {
                q = q.Where(u => u.DisplayName.Contains(search) || (u.Username != null && u.Username.Contains(search)) || (u.CodeforceHandle != null && u.CodeforceHandle.Contains(search)));
            }

            var total = await q.LongCountAsync();

            var items = await q.OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new {
                    u.Id,
                    displayName = u.DisplayName,
                    username = u.Username,
                    profilePictureUrl = u.ProfilePictureUrl,
                    university = u.University,
                    department = u.Department,
                    codeforceHandle = u.CodeforceHandle,
                    leetcodeUsername = u.LeetcodeUsername,
                    githubUsername = u.GithubUsername,
                    hackerRankHandle = u.HackerRankHandle,
                    codeChefHandle = u.CodeChefHandle,
                    atCoderHandle = u.AtCoderHandle,
                    favoritePlatform = !string.IsNullOrEmpty(u.CodeforceHandle) ? "Codeforces" : !string.IsNullOrEmpty(u.LeetcodeUsername) ? "LeetCode" : !string.IsNullOrEmpty(u.GithubUsername) ? "GitHub" : !string.IsNullOrEmpty(u.HackerRankHandle) ? "HackerRank" : null
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, items });
        }

        [HttpGet("growth")]
        public async Task<IActionResult> GetGrowth()
        {
            var totalUsers = await _db.Users.LongCountAsync();
            var newUsers7d = await _db.Users.Where(u => u.CreatedAt >= DateTime.UtcNow.AddDays(-7)).LongCountAsync();
            var newUsersToday = await _db.Users.Where(u => u.CreatedAt >= DateTime.UtcNow.Date).LongCountAsync();
            var totalUniversities = await _db.Users.Where(u => !string.IsNullOrEmpty(u.University)).Select(u => u.University).Distinct().CountAsync();
            var totalConnectedHandles = await _db.Users.Where(u => !string.IsNullOrEmpty(u.CodeforceHandle) || !string.IsNullOrEmpty(u.LeetcodeUsername) || !string.IsNullOrEmpty(u.GithubUsername) || !string.IsNullOrEmpty(u.HackerRankHandle) || !string.IsNullOrEmpty(u.CodeChefHandle) || !string.IsNullOrEmpty(u.AtCoderHandle)).LongCountAsync();

            return Ok(new {
                totalUsers,
                newUsers7d,
                newUsersToday,
                totalUniversities,
                totalConnectedHandles
            });
        }
    }
}
