using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public static class ContestSeeder
    {
        public static async Task SeedAsync(AppDbContext db, IExternalContestFetcher fetcher)
        {
            // Fetch from external APIs and persist only new contests.
            var fetched = new List<Contest>();
            var seenContestKeys = new HashSet<string>(StringComparer.Ordinal);
            var addedCountsByPlatform = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            // Run external fetches in parallel and combine results to reduce total wait time
            var codeforcesTask = fetcher.FetchCodeforcesContestsAsync();
            var atcoderTask = fetcher.FetchAtCoderContestsAsync();
            var leetcodeTask = fetcher.FetchLeetCodeContestsAsync();
            var codechefTask = fetcher.FetchCodeChefContestsAsync();
            var gfgTask = fetcher.FetchGfgContestsAsync();

            await Task.WhenAll(codeforcesTask, atcoderTask, leetcodeTask, codechefTask, gfgTask);

            fetched.AddRange(codeforcesTask.IsCompletedSuccessfully ? codeforcesTask.Result : new List<Contest>());
            fetched.AddRange(atcoderTask.IsCompletedSuccessfully ? atcoderTask.Result : new List<Contest>());
            fetched.AddRange(leetcodeTask.IsCompletedSuccessfully ? leetcodeTask.Result : new List<Contest>());
            fetched.AddRange(codechefTask.IsCompletedSuccessfully ? codechefTask.Result : new List<Contest>());
            fetched.AddRange(gfgTask.IsCompletedSuccessfully ? gfgTask.Result : new List<Contest>());

            if (fetched.Count == 0) return;

            var now = DateTime.UtcNow;
            var addedContestCount = 0;
            var existingContestCount = await db.Contests.LongCountAsync();
            var existingCountsByPlatform = await db.Contests
                .GroupBy(c => c.Platform)
                .Select(g => new { Platform = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Platform, x => x.Count, StringComparer.OrdinalIgnoreCase);

            foreach (var contest in fetched)
            {
                // Normalize CreatedAt
                contest.CreatedAt = now;

                var contestKey = GetContestKey(contest);
                if (!seenContestKeys.Add(contestKey))
                {
                    continue;
                }

                // Determine uniqueness: prefer ExternalId if present, otherwise platform+name+starttime
                bool exists;
                if (!string.IsNullOrWhiteSpace(contest.ExternalId))
                {
                    exists = await db.Contests.AnyAsync(c => c.ExternalId == contest.ExternalId);
                }
                else
                {
                    exists = await db.Contests.AnyAsync(c => c.Platform == contest.Platform && c.Name == contest.Name && c.StartTime == contest.StartTime);
                }

                if (!exists)
                {
                    db.Contests.Add(contest);
                    addedContestCount++;

                    if (addedCountsByPlatform.ContainsKey(contest.Platform))
                    {
                        addedCountsByPlatform[contest.Platform]++;
                    }
                    else
                    {
                        addedCountsByPlatform[contest.Platform] = 1;
                    }
                }
            }

            if (addedContestCount > 0)
            {
                var globalStat = await db.GlobalContestStats.SingleOrDefaultAsync(s => s.Id == 1);
                if (globalStat == null)
                {
                    db.GlobalContestStats.Add(new GlobalContestStat
                    {
                        Id = 1,
                        LifetimeContestCount = existingContestCount + addedContestCount
                    });
                }
                else
                {
                    globalStat.LifetimeContestCount += addedContestCount;
                }

                foreach (var platformEntry in addedCountsByPlatform)
                {
                    var platformStat = await db.PlatformContestStats.SingleOrDefaultAsync(s => s.Platform == platformEntry.Key);
                    if (platformStat == null)
                    {
                        db.PlatformContestStats.Add(new PlatformContestStat
                        {
                            Platform = platformEntry.Key,
                            LifetimeContestCount = (existingCountsByPlatform.TryGetValue(platformEntry.Key, out var existingPlatformCount)
                                ? existingPlatformCount
                                : 0) + platformEntry.Value
                        });
                    }
                    else
                    {
                        platformStat.LifetimeContestCount += platformEntry.Value;
                    }
                }
            }

            await db.SaveChangesAsync();
        }

        private static string GetContestKey(Contest contest)
        {
            if (!string.IsNullOrWhiteSpace(contest.ExternalId))
            {
                return $"external:{contest.ExternalId}";
            }

            return $"platform:{contest.Platform}|name:{contest.Name}|start:{contest.StartTime:o}";
        }
    }
}
