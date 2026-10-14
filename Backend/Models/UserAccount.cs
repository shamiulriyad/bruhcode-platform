using System;

namespace Backend.Models
{
    public class UserAccount
    {
        public int Id { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string? Username { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? University { get; set; }
        public string? Department { get; set; }
        public string? Bio { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public string? CodeforceHandle { get; set; }
        public string? LeetcodeUsername { get; set; }
        public string? HackerRankHandle { get; set; }
        public string? CodeChefHandle { get; set; }
        public string? AtCoderHandle { get; set; }
        public string? GithubUsername { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}