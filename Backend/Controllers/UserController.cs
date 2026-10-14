using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/user")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _db;

        public UserController(AppDbContext db)
        {
            _db = db;
        }

        public class SaveContestDto
        {
            public int ContestId { get; set; }
            public string Status { get; set; } = "Interested";
        }

        public class UpdateProfileDto
        {
            public string? DisplayName { get; set; }
            public string? Username { get; set; }
            public string? Email { get; set; }
            public string? University { get; set; }
            public string? Department { get; set; }
            public string? Bio { get; set; }
            public string? ProfilePictureUrl { get; set; }
            public string? CodeforceHandle { get; set; }
            public string? LeetcodeUsername { get; set; }
            public string? HackerRankHandle { get; set; }
            public string? CodeChefHandle { get; set; }
            public string? AtCoderHandle { get; set; }
            public string? GithubUsername { get; set; }
        }

        public class ChangePasswordDto
        {
            public string CurrentPassword { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
            public string ConfirmPassword { get; set; } = string.Empty;
        }

        private int? GetUserId()
        {
            var rawValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(rawValue, out var id) ? id : null;
        }

        [HttpGet("saved-contests")]
        public async Task<IActionResult> GetSavedContests()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var items = await _db.SavedContests
                .Where(item => item.UserAccountId == userId)
                .Include(item => item.Contest)
                .OrderByDescending(item => item.CreatedAt)
                .ToListAsync();

            return Ok(items);
        }

        [HttpPost("add-contest")]
        public async Task<IActionResult> AddContest([FromBody] SaveContestDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var contest = await _db.Contests.FindAsync(dto.ContestId);
            if (contest == null) return NotFound("Contest not found");

            var exists = await _db.SavedContests.AnyAsync(item => item.UserAccountId == userId && item.ContestId == dto.ContestId);
            if (exists) return BadRequest("Contest already saved");

            var saved = new SavedContest
            {
                ContestId = dto.ContestId,
                UserAccountId = userId.Value,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "Interested" : dto.Status
            };

            _db.SavedContests.Add(saved);
            await _db.SaveChangesAsync();

            return Ok(saved);
        }

        [HttpDelete("saved-contests/{contestId}")]
        public async Task<IActionResult> RemoveContest(int contestId)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var saved = await _db.SavedContests.FirstOrDefaultAsync(item => item.UserAccountId == userId && item.ContestId == contestId);
            if (saved == null) return NotFound("Saved contest not found");

            _db.SavedContests.Remove(saved);
            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found");

            // Fetch all brain gym game stats for this user
            var brainGymStats = await _db.UserGameScores
                .Where(s => s.UserId == userId)
                .Select(s => new
                {
                    gameType = s.GameType,
                    totalCorrect = s.TotalCorrect,
                    totalAttempted = s.TotalAttempted,
                    bestStreak = s.BestStreak,
                    accuracy = s.TotalAttempted > 0
                        ? Math.Round((double)s.TotalCorrect / s.TotalAttempted * 100, 1)
                        : 0,
                    lastPlayedAt = s.LastPlayedAt
                })
                .ToListAsync();

            return Ok(new
            {
                id = user.Id,
                displayName = user.DisplayName,
                username = user.Username,
                email = user.Email,
                university = user.University,
                department = user.Department,
                bio = user.Bio,
                profilePictureUrl = user.ProfilePictureUrl,
                codeforceHandle = user.CodeforceHandle,
                leetcodeUsername = user.LeetcodeUsername,
                hackerRankHandle = user.HackerRankHandle,
                codeChefHandle = user.CodeChefHandle,
                atCoderHandle = user.AtCoderHandle,
                githubUsername = user.GithubUsername,
                createdAt = user.CreatedAt,
                brainGymStats
            });
        }

        [HttpGet("/api/users/{userId}/profile")]
        public async Task<IActionResult> GetProfileById(int userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found");

            var brainGymStats = await _db.UserGameScores
                .Where(s => s.UserId == userId)
                .Select(s => new
                {
                    gameType = s.GameType,
                    totalCorrect = s.TotalCorrect,
                    totalAttempted = s.TotalAttempted,
                    bestStreak = s.BestStreak,
                    accuracy = s.TotalAttempted > 0
                        ? Math.Round((double)s.TotalCorrect / s.TotalAttempted * 100, 1)
                        : 0,
                    lastPlayedAt = s.LastPlayedAt
                })
                .ToListAsync();

            return Ok(new
            {
                id = user.Id,
                displayName = user.DisplayName,
                username = user.Username,
                email = user.Email,
                university = user.University,
                department = user.Department,
                bio = user.Bio,
                profilePictureUrl = user.ProfilePictureUrl,
                codeforceHandle = user.CodeforceHandle,
                leetcodeUsername = user.LeetcodeUsername,
                hackerRankHandle = user.HackerRankHandle,
                codeChefHandle = user.CodeChefHandle,
                atCoderHandle = user.AtCoderHandle,
                githubUsername = user.GithubUsername,
                createdAt = user.CreatedAt,
                brainGymStats
            });
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found");

            if (!string.IsNullOrWhiteSpace(dto.Username))
            {
                var usernameLower = dto.Username.Trim().ToLowerInvariant();
                if (!System.Text.RegularExpressions.Regex.IsMatch(usernameLower, @"^[a-z0-9_-]+$") || usernameLower.Length < 3 || usernameLower.Length > 20)
                {
                    return BadRequest("Username must be 3-20 characters with only letters, numbers, underscore, and hyphen.");
                }

                var usernameExists = await _db.Users.AnyAsync(u => u.Id != user.Id && u.Username != null && u.Username.ToLower() == usernameLower);
                if (usernameExists)
                {
                    return BadRequest("Username already taken.");
                }

                user.Username = usernameLower;
            }

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var email = dto.Email.Trim().ToLowerInvariant();
                var emailExists = await _db.Users.AnyAsync(u => u.Id != user.Id && u.Email == email);
                if (emailExists)
                {
                    return BadRequest("Email already registered.");
                }

                user.Email = email;
            }

            // Update fields
            if (!string.IsNullOrWhiteSpace(dto.DisplayName))
                user.DisplayName = dto.DisplayName;
            
            if (!string.IsNullOrWhiteSpace(dto.University))
                user.University = dto.University;
            
            if (!string.IsNullOrWhiteSpace(dto.Department))
                user.Department = dto.Department;

            if (!string.IsNullOrWhiteSpace(dto.Bio))
                user.Bio = dto.Bio;

            if (!string.IsNullOrWhiteSpace(dto.ProfilePictureUrl))
                user.ProfilePictureUrl = dto.ProfilePictureUrl;
            
            if (!string.IsNullOrWhiteSpace(dto.CodeforceHandle))
                user.CodeforceHandle = dto.CodeforceHandle;
            
            if (!string.IsNullOrWhiteSpace(dto.LeetcodeUsername))
                user.LeetcodeUsername = dto.LeetcodeUsername;

            if (!string.IsNullOrWhiteSpace(dto.HackerRankHandle))
                user.HackerRankHandle = dto.HackerRankHandle;

            if (!string.IsNullOrWhiteSpace(dto.CodeChefHandle))
                user.CodeChefHandle = dto.CodeChefHandle;

            if (!string.IsNullOrWhiteSpace(dto.AtCoderHandle))
                user.AtCoderHandle = dto.AtCoderHandle;

            if (!string.IsNullOrWhiteSpace(dto.GithubUsername))
                user.GithubUsername = dto.GithubUsername;

            _db.Users.Update(user);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                id = user.Id,
                displayName = user.DisplayName,
                username = user.Username,
                email = user.Email,
                university = user.University,
                department = user.Department,
                bio = user.Bio,
                profilePictureUrl = user.ProfilePictureUrl,
                codeforceHandle = user.CodeforceHandle,
                leetcodeUsername = user.LeetcodeUsername,
                hackerRankHandle = user.HackerRankHandle,
                codeChefHandle = user.CodeChefHandle,
                atCoderHandle = user.AtCoderHandle,
                githubUsername = user.GithubUsername,
                createdAt = user.CreatedAt
            });
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword) || string.IsNullOrWhiteSpace(dto.ConfirmPassword))
            {
                return BadRequest("All password fields are required.");
            }

            if (dto.NewPassword.Length < 6)
            {
                return BadRequest("New password must be at least 6 characters.");
            }

            if (dto.NewPassword != dto.ConfirmPassword)
            {
                return BadRequest("New password and confirmation do not match.");
            }

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound("User not found");

            var currentHash = Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(dto.CurrentPassword)));
            if (user.PasswordHash != currentHash)
            {
                return BadRequest("Current password is incorrect.");
            }

            user.PasswordHash = Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(dto.NewPassword)));
            _db.Users.Update(user);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Password updated successfully." });
        }
    }
}