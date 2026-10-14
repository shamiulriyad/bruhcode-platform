using System;

namespace Backend.Models
{
    public class RoomMessage
    {
        public int Id { get; set; }

        public int RoomId { get; set; }
        public Room? Room { get; set; }

        /// <summary>Nullable — null means general room chat, non-null scopes to a problem thread</summary>
        public int? RoomProblemId { get; set; }
        public RoomProblem? RoomProblem { get; set; }

        public int UserId { get; set; }
        public UserAccount? User { get; set; }

        /// <summary>Markdown content (supports code snippets)</summary>
        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>For threaded replies — null if top-level message</summary>
        public int? ParentMessageId { get; set; }
        public RoomMessage? ParentMessage { get; set; }
    }
}
