using System;

namespace Backend.Models
{
    public class ContactMessage
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = "New"; // New | Read | Responded
        public string? IpAddress { get; set; }
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }
}
