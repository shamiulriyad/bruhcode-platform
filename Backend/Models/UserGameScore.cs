using System;

namespace Backend.Models
{
    public class UserGameScore
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        public UserAccount? User { get; set; }

        public int GameId { get; set; }
        public Game? Game { get; set; }

        public string GameType { get; set; } = "complexity_guess";

        public int TotalCorrect { get; set; }
        public int TotalAttempted { get; set; }
        public int BestStreak { get; set; }

        public DateTime LastPlayedAt { get; set; } = DateTime.UtcNow;
    }
}
