using System;

namespace Backend.Models
{
    public enum SolveStatus
    {
        Unattempted,
        Attempted,
        Solved
    }

    public class RoomProgress
    {
        public int Id { get; set; }

        public int RoomId { get; set; }
        public Room? Room { get; set; }

        public int UserId { get; set; }
        public UserAccount? User { get; set; }

        public int RoomProblemId { get; set; }
        public RoomProblem? RoomProblem { get; set; }

        public SolveStatus Status { get; set; } = SolveStatus.Unattempted;
        public DateTime? SolvedAt { get; set; }
        public int Attempts { get; set; } = 0;
    }
}
