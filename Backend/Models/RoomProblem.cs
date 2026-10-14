using System;
using System.Collections.Generic;

namespace Backend.Models
{
    public class RoomProblem
    {
        public int Id { get; set; }

        public int RoomId { get; set; }
        public Room? Room { get; set; }

        /// <summary>Problem index label (A, B, C, ...)</summary>
        public string ProblemIndex { get; set; } = string.Empty;

        public string ProblemName { get; set; } = string.Empty;
        public string ProblemUrl { get; set; } = string.Empty;

        /// <summary>Display order within the room</summary>
        public int SortOrder { get; set; }

        // Navigation
        public ICollection<RoomProgress> Progress { get; set; } = new List<RoomProgress>();
        public ICollection<RoomMessage> Messages { get; set; } = new List<RoomMessage>();
    }
}
