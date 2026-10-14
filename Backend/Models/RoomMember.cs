using System;

namespace Backend.Models
{
    public enum MemberRole
    {
        Host,
        Member
    }

    public class RoomMember
    {
        public int Id { get; set; }

        public int RoomId { get; set; }
        public Room? Room { get; set; }

        public int UserId { get; set; }
        public UserAccount? User { get; set; }

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public MemberRole Role { get; set; } = MemberRole.Member;
    }
}
