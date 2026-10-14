using System;

namespace Backend.Models
{
    public enum RoomStatus
    {
        Scheduled,
        Live,
        Ended
    }

    public enum RoomVisibility
    {
        Private,
        Public
    }

    public class Room
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        // FK → Contests table
        public int ContestId { get; set; }
        public Contest? Contest { get; set; }

        // FK → Users table (the room creator)
        public int HostId { get; set; }
        public UserAccount? Host { get; set; }

        public DateTime StartTime { get; set; }

        /// <summary>Duration in minutes (copied from contest but can be overridden)</summary>
        public int DurationMinutes { get; set; }

        public RoomStatus Status { get; set; } = RoomStatus.Scheduled;
        public RoomVisibility Visibility { get; set; } = RoomVisibility.Private;

        /// <summary>8-character unique invite code</summary>
        public string InviteCode { get; set; } = string.Empty;

        public int MaxMembers { get; set; } = 10;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<RoomMember> Members { get; set; } = new List<RoomMember>();
        public ICollection<RoomProblem> Problems { get; set; } = new List<RoomProblem>();
        public ICollection<RoomProgress> Progress { get; set; } = new List<RoomProgress>();
        public ICollection<RoomMessage> Messages { get; set; } = new List<RoomMessage>();
    }
}
