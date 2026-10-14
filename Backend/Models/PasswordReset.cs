using System;

namespace Backend.Models
{
    public class PasswordReset
    {
        public int Id { get; set; }
        public int UserAccountId { get; set; }
        public string Code { get; set; } = string.Empty; // 6-digit code
        public string? ResetToken { get; set; } // guid for password reset
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool Used { get; set; } = false;
        public int Attempts { get; set; } = 0;
    }
}
