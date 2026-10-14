using System;
using System.Collections.Generic;

namespace Backend.Models
{
    public class Game
    {
        public int Id { get; set; }
        public string GameKey { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string IconKey { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public ICollection<UserGameScore>? Scores { get; set; }
        public ICollection<BrainGymHistory>? Histories { get; set; }
        public ICollection<GameQuestion>? Questions { get; set; }
    }
}
