using System;

namespace Backend.Models
{
    public class Contest
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Platform { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        // When this contest was first stored in our DB
        public DateTime CreatedAt { get; set; }
        // Duration in minutes
        public int Duration { get; set; }
        public string Url { get; set; } = string.Empty;
        // Optional external identifier from the source platform when available
        public string? ExternalId { get; set; }

        public string Difficulty => DetermineDifficulty();

        private string DetermineDifficulty()
        {
            if (Name.Contains("Div. 3", StringComparison.OrdinalIgnoreCase)) return "Beginner";
            if (Name.Contains("Div. 2", StringComparison.OrdinalIgnoreCase)) return "Intermediate";
            return "Advanced";
        }
    }
}
