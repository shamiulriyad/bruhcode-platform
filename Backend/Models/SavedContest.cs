using System;

namespace Backend.Models
{
    public class SavedContest
    {
        public int Id { get; set; }
        public int UserAccountId { get; set; }
        public UserAccount? UserAccount { get; set; }
        public int ContestId { get; set; }
        public Contest? Contest { get; set; }
        public string Status { get; set; } = "Interested";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}