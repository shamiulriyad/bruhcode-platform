using Backend.Models;
using System.Globalization;
using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Playwright;

namespace Backend.Services
{
    public interface IExternalContestFetcher
    {
        Task<List<Contest>> FetchCodeforcesContestsAsync();
        Task<List<Contest>> FetchAtCoderContestsAsync();
        Task<List<Contest>> FetchLeetCodeContestsAsync();
        Task<List<Contest>> FetchCodeChefContestsAsync();
        Task<List<Contest>> FetchGfgContestsAsync();
    }

    public class ExternalContestFetcher : IExternalContestFetcher
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ExternalContestFetcher> _logger;

        public ExternalContestFetcher(HttpClient httpClient, ILogger<ExternalContestFetcher> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            // Add User-Agent to avoid 403/404 rejections
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        }

        public async Task<List<Contest>> FetchCodeforcesContestsAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("https://codeforces.com/api/contest.list?gym=false");
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (root.GetProperty("status").GetString() != "OK")
                {
                    _logger.LogWarning("Codeforces API returned non-OK status");
                    return new();
                }

                var contests = new List<Contest>();
                var now = DateTime.UtcNow;

                foreach (var item in root.GetProperty("result").EnumerateArray().Take(10))
                {
                    var startTimeSec = item.GetProperty("startTimeSeconds").GetInt64();
                    var durationSec = item.GetProperty("durationSeconds").GetInt64();
                    var startTime = UnixTimeStampToDateTime(startTimeSec);

                    if (startTime < now) continue;

                    contests.Add(new Contest
                    {
                        Name = item.GetProperty("name").GetString() ?? "Unknown",
                        Platform = "Codeforces",
                        StartTime = startTime,
                        Duration = (int)(durationSec / 60),
                        Url = "https://codeforces.com/contests"
                    });
                }

                _logger.LogInformation($"Fetched {contests.Count} Codeforces contests");
                return contests;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching Codeforces contests: {ex.Message}");
                return new();
            }
        }

        public async Task<List<Contest>> FetchAtCoderContestsAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("https://atcoder.jp/contests/?lang=en");
                response.EnsureSuccessStatusCode();

                var html = await response.Content.ReadAsStringAsync();
                var contests = new List<Contest>();
                var now = DateTime.UtcNow;

                // Extract all table rows containing contests
                foreach (Match trMatch in Regex.Matches(
                    html,
                    @"<tr>\s*<td[^>]*>.*?<time[^>]*>(?<datetime>[^<]+)<\/time>.*?<\/td>\s*<td[^>]*>.*?<a[^>]*href=""(?<url>[^""]+)""[^>]*>(?<title>[^<]+)<\/a>",
                    RegexOptions.IgnoreCase | RegexOptions.Singleline))
                {
                    try
                    {
                        var dateTimeText = trMatch.Groups["datetime"].Value.Trim();
                        var title = WebUtility.HtmlDecode(trMatch.Groups["title"].Value).Trim();

                        // Parse datetime like "2026-05-02 21:00:00+0900"
                        if (!DateTime.TryParseExact(
                                dateTimeText.Substring(0, 19), // Extract just "2026-05-02 21:00:00"
                                "yyyy-MM-dd HH:mm:ss",
                                CultureInfo.InvariantCulture,
                                DateTimeStyles.None,
                                out var startTime))
                        {
                            continue;
                        }

                        // Convert from JST (Japan Standard Time, UTC+9) to UTC
                        startTime = startTime.AddHours(-9);
                        
                        // Explicitly mark as UTC
                        startTime = DateTime.SpecifyKind(startTime, DateTimeKind.Utc);

                        // Filter out past contests
                        if (startTime < now)
                        {
                            continue;
                        }

                        // Skip certain contest types (practice contests, etc.)
                        if (title.Contains("Practice") || title.Contains("AtCoder Library"))
                        {
                            continue;
                        }

                        // Default duration for AtCoder contests (usually 2 hours)
                        int duration = 120;

                        var contestUrl = trMatch.Groups["url"].Value.Trim();
                        if (!contestUrl.StartsWith("http"))
                        {
                            contestUrl = "https://atcoder.jp" + contestUrl;
                        }

                        contests.Add(new Contest
                        {
                            Name = title,
                            Platform = "AtCoder",
                            StartTime = startTime,
                            Duration = duration,
                            Url = contestUrl
                        });

                        if (contests.Count >= 10)
                        {
                            break;
                        }
                    }
                    catch (Exception itemEx)
                    {
                        _logger.LogWarning($"Error parsing AtCoder contest: {itemEx.Message}");
                    }
                }

                _logger.LogInformation($"Fetched {contests.Count} AtCoder contests");
                return contests;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching AtCoder contests: {ex.Message}");
                return new();
            }
        }

        public async Task<List<Contest>> FetchLeetCodeContestsAsync()
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, "https://leetcode.com/graphql")
                {
                    Content = new StringContent(
                        "{\"query\":\"query { allContests { title titleSlug startTime duration originStartTime isVirtual } }\"}",
                        System.Text.Encoding.UTF8,
                        "application/json")
                };

                request.Headers.TryAddWithoutValidation("Accept", "application/json, text/plain, */*");
                request.Headers.TryAddWithoutValidation("Referer", "https://leetcode.com/contest/");
                request.Headers.TryAddWithoutValidation("Origin", "https://leetcode.com");

                var response = await _httpClient.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"LeetCode API returned: {response.StatusCode} - {responseBody}");
                    return new();
                }

                using var doc = JsonDocument.Parse(responseBody);
                var root = doc.RootElement;

                var contests = new List<Contest>();
                var now = DateTime.UtcNow;

                if (!root.TryGetProperty("data", out var data) ||
                    !data.TryGetProperty("allContests", out var allContests) ||
                    allContests.ValueKind != JsonValueKind.Array)
                {
                    _logger.LogWarning("LeetCode GraphQL response doesn't contain expected contest array");
                    return new();
                }

                foreach (var item in allContests.EnumerateArray())
                {
                    try
                    {
                        if (!item.TryGetProperty("startTime", out var startTimeElem) ||
                            !item.TryGetProperty("duration", out var durationElem) ||
                            !item.TryGetProperty("title", out var titleElem))
                        {
                            continue;
                        }

                        var startTime = UnixTimeStampToDateTime(startTimeElem.GetInt64());
                        if (startTime < now)
                        {
                            continue;
                        }

                        var titleSlug = item.TryGetProperty("titleSlug", out var titleSlugElem)
                            ? titleSlugElem.GetString()
                            : null;

                        contests.Add(new Contest
                        {
                            Name = titleElem.GetString() ?? "Unknown",
                            Platform = "LeetCode",
                            StartTime = startTime,
                            Duration = durationElem.GetInt32() / 60,
                            Url = string.IsNullOrWhiteSpace(titleSlug)
                                ? "https://leetcode.com/contest/"
                                : $"https://leetcode.com/contest/{titleSlug}/"
                        });

                        if (contests.Count >= 10)
                        {
                            break;
                        }
                    }
                    catch (Exception itemEx)
                    {
                        _logger.LogWarning($"Error parsing LeetCode contest item: {itemEx.Message}");
                    }
                }

                _logger.LogInformation($"Fetched {contests.Count} LeetCode contests");
                return contests;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching LeetCode contests: {ex.Message}");
                return new();
            }
        }

        public async Task<List<Contest>> FetchCodeChefContestsAsync()
        {
            try
            {
                const string url = "https://www.codechef.com/api/list/contests/all";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                using var stream = await response.Content.ReadAsStreamAsync();
                using var document = await JsonDocument.ParseAsync(stream);

                var contests = new List<Contest>();
                var now = DateTime.UtcNow;

                if (document.RootElement.TryGetProperty("future_contests", out var futureContests))
                {
                    foreach (var item in futureContests.EnumerateArray())
                    {
                        var contestName = item.GetProperty("contest_name").GetString();
                        var contestCode = item.GetProperty("contest_code").GetString();
                        var startIso = item.GetProperty("contest_start_date_iso").GetString();
                        var durationText = item.GetProperty("contest_duration").GetString();

                        if (string.IsNullOrWhiteSpace(contestName) || string.IsNullOrWhiteSpace(contestCode) || string.IsNullOrWhiteSpace(startIso) || string.IsNullOrWhiteSpace(durationText))
                        {
                            continue;
                        }

                        if (!DateTimeOffset.TryParse(startIso, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var startDateTimeOffset))
                        {
                            continue;
                        }

                        var startTime = startDateTimeOffset.UtcDateTime;
                        if (startTime <= now)
                        {
                            continue;
                        }

                        if (!int.TryParse(durationText, out var durationMinutes))
                        {
                            durationMinutes = 0;
                        }

                        contests.Add(new Contest
                        {
                            Name = contestName,
                            Platform = "CodeChef",
                            StartTime = DateTime.SpecifyKind(startTime, DateTimeKind.Utc),
                            Duration = durationMinutes,
                            Url = $"https://www.codechef.com/{contestCode}"
                        });

                        if (contests.Count >= 10)
                        {
                            break;
                        }
                    }
                }

                _logger.LogInformation($"Fetched {contests.Count} CodeChef contests");
                return contests;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching CodeChef contests: {ex.Message}");
                return new();
            }
        }

        private static DateTime GetNextDayOfWeek(DateTime from, DayOfWeek dayOfWeek)
        {
            var daysToAdd = (dayOfWeek - from.DayOfWeek + 7) % 7;
            if (daysToAdd == 0 && from.Hour >= 14)
            {
                daysToAdd = 7;
            }

            return from.Date.AddDays(daysToAdd);
        }

        public async Task<List<Contest>> FetchGfgContestsAsync()
        {
            try
            {
                const string url = "https://codolio.com/event-tracker";
                var contests = new List<Contest>();
                var now = DateTime.UtcNow;

                var playwright = await Playwright.CreateAsync();
                await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
                {
                    Headless = true,
                    Args = new[] { "--no-sandbox" }
                });

                await using var context = await browser.NewContextAsync(new BrowserNewContextOptions
                {
                    ViewportSize = new ViewportSize { Width = 1440, Height = 1600 }
                });

                var page = await context.NewPageAsync();
                await page.GotoAsync(url, new PageGotoOptions { WaitUntil = WaitUntilState.NetworkIdle });
                await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

                var allLinks = await page.Locator("a[href*='google.com/calendar/render']")
                    .AllAsync();

                _logger.LogInformation($"Found {allLinks.Count} total calendar links on Codolio");

                foreach (var linkElement in allLinks)
                {
                    var calendarLink = await linkElement.GetAttributeAsync("href");
                    if (string.IsNullOrWhiteSpace(calendarLink) || !calendarLink.Contains("GeeksForGeeks", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    var decodedLink = Uri.UnescapeDataString(calendarLink);
                    var linkMatch = Regex.Match(
                        decodedLink,
                        @"text=(?<text>[^&]+)&dates=(?<start>\d{8}T\d{9})[\s\+]053/(?<end>\d{8}T\d{9})[\s\+]053&details=\[GeeksForGeeks\]:\s*(?<details>[^&]+)&sf=true&output=xml&location=(?<location>https://practice\.geeksforgeeks\.org/contest/[^&]+)",
                        RegexOptions.IgnoreCase | RegexOptions.Singleline);

                    if (!linkMatch.Success)
                    {
                        _logger.LogWarning($"GFG link regex did not match: {decodedLink.Substring(0, Math.Min(150, decodedLink.Length))}");
                        continue;
                    }

                    var titleText = Uri.UnescapeDataString(linkMatch.Groups["text"].Value).Trim().Replace("+", " ");
                    var detailsText = Uri.UnescapeDataString(linkMatch.Groups["details"].Value).Trim().Replace("+", " ");
                    var locationText = Uri.UnescapeDataString(linkMatch.Groups["location"].Value).Trim();

                    if (!DateTime.TryParseExact(
                        linkMatch.Groups["start"].Value,
                        "yyyyMMdd'T'HHmmssfff",
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.None,
                        out var startLocal) ||
                        !DateTime.TryParseExact(
                            linkMatch.Groups["end"].Value,
                            "yyyyMMdd'T'HHmmssfff",
                            CultureInfo.InvariantCulture,
                            DateTimeStyles.None,
                            out var endLocal))
                    {
                        _logger.LogWarning($"GFG date parse failed for: {titleText}");
                        continue;
                    }

                    var startTime = DateTime.SpecifyKind(startLocal.AddHours(-5).AddMinutes(-30), DateTimeKind.Utc);
                    if (startTime <= now)
                    {
                        _logger.LogWarning($"GFG contest already started or in past: {titleText} at {startTime}");
                        continue;
                    }

                    var durationMinutes = (int)Math.Max(0, (endLocal - startLocal).TotalMinutes);

                    contests.Add(new Contest
                    {
                        Name = string.IsNullOrWhiteSpace(titleText) ? detailsText : titleText,
                        Platform = "GeeksforGeeks",
                        StartTime = DateTime.SpecifyKind(startTime, DateTimeKind.Utc),
                        Duration = durationMinutes > 0 ? durationMinutes : 120,
                        Url = locationText
                    });

                    _logger.LogInformation($"Added GFG contest: {titleText} at {startTime}");

                    if (contests.Count >= 10)
                    {
                        break;
                    }
                }

                _logger.LogInformation($"Fetched {contests.Count} GeeksforGeeks contests");
                return contests;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching GeeksforGeeks contests: {ex.Message}\n{ex.StackTrace}");
                return new();
            }
        }

        private static DateTime UnixTimeStampToDateTime(long unixTimestamp)
        {
            var dateTime = new DateTime(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc);
            dateTime = dateTime.AddSeconds(unixTimestamp);
            // Ensure it's always UTC
            if (dateTime.Kind != DateTimeKind.Utc)
            {
                dateTime = DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
            }
            return dateTime;
        }
    }
}
