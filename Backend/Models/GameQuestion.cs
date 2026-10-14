using System;

namespace Backend.Models
{
    public class GameQuestion
    {
        public int Id { get; set; }
        
        public int GameId { get; set; }
        public Game? Game { get; set; }

        /// <summary>Flexible JSON string to hold the specific game question layout fields</summary>
        public string Content { get; set; } = string.Empty;

        public string Difficulty { get; set; } = string.Empty;
    }
}
