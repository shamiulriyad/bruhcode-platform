using System.Net;
using System.Text;
using Backend.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Backend.Tests
{
    public class GfgFetcherTests
    {
        private sealed class StubHandler : HttpMessageHandler
        {
            private readonly string _json;
            public StubHandler(string json) => _json = json;

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
                Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(_json, Encoding.UTF8, "application/json")
                });
        }

        private static ExternalContestFetcher CreateFetcher(string json) =>
            new(new HttpClient(new StubHandler(json)), NullLogger<ExternalContestFetcher>.Instance);

        [Fact]
        public async Task FetchGfg_ParsesUpcomingContestsAndConvertsIstToUtc()
        {
            var start = DateTime.UtcNow.AddDays(3).Date.AddHours(19); // 19:00 IST
            var json = $$"""
            {
              "results": {
                "upcoming": [
                  { "slug": "weekly-200", "name": " GfG Weekly 200 ", "start_time": "{{start:yyyy-MM-ddTHH:mm:ss}}", "end_time": "{{start.AddMinutes(90):yyyy-MM-ddTHH:mm:ss}}" }
                ],
                "past": []
              }
            }
            """;

            var contests = await CreateFetcher(json).FetchGfgContestsAsync();

            var contest = Assert.Single(contests);
            Assert.Equal("GfG Weekly 200", contest.Name);
            Assert.Equal("GeeksforGeeks", contest.Platform);
            Assert.Equal(start.AddHours(-5).AddMinutes(-30), contest.StartTime);
            Assert.Equal(DateTimeKind.Utc, contest.StartTime.Kind);
            Assert.Equal(90, contest.Duration);
            Assert.Equal("https://practice.geeksforgeeks.org/contest/weekly-200", contest.Url);
        }

        [Fact]
        public async Task FetchGfg_SkipsPastContestsAndHandlesEmptyList()
        {
            var past = DateTime.UtcNow.AddDays(-2);
            var json = $$"""
            {
              "results": {
                "upcoming": [
                  { "slug": "old", "name": "Old", "start_time": "{{past:yyyy-MM-ddTHH:mm:ss}}", "end_time": "{{past.AddHours(2):yyyy-MM-ddTHH:mm:ss}}" }
                ]
              }
            }
            """;

            Assert.Empty(await CreateFetcher(json).FetchGfgContestsAsync());
            Assert.Empty(await CreateFetcher("""{ "results": { "upcoming": [] } }""").FetchGfgContestsAsync());
        }
    }
}
