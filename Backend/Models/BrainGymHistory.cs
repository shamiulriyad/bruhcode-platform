using System;

namespace Backend.Models
{
    public class BrainGymHistory
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public UserAccount? User { get; set; }

        public int GameId { get; set; }
        public Game? Game { get; set; }

        public string GameType { get; set; } = "complexity_guess";

        public int Score { get; set; }
        public double Accuracy { get; set; } // 0.0 – 100.0

        public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
    }
}
