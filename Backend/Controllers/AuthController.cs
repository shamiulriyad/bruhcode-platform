using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _configuration;
        private readonly Backend.Services.IEmailSender _emailSender;

        public AuthController(AppDbContext db, IConfiguration configuration, Backend.Services.IEmailSender emailSender)
        {
            _db = db;
            _configuration = configuration;
            _emailSender = emailSender;
        }

        public class RegisterDto
        {
            public string DisplayName { get; set; } = string.Empty;
            public string Username { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
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

        public class LoginDto
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class TextValueDto
        {
            public string Value { get; set; } = string.Empty;
        }

        private static string HashPassword(string password)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }

        private string CreateToken(UserAccount user)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? "development-only-super-secret-key-change-me";
            var jwtIssuer = _configuration["Jwt:Issuer"] ?? "CodingPlatform";
            var jwtAudience = _configuration["Jwt:Audience"] ?? "CodingPlatformUsers";

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Name, user.DisplayName),
                new(ClaimTypes.Email, user.Email)
            };

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [HttpPost("validate-username")]
        public async Task<IActionResult> ValidateUsername([FromBody] TextValueDto dto)
        {
            var username = dto.Value;
            if (string.IsNullOrWhiteSpace(username) || username.Length < 3 || username.Length > 20)
            {
                return Ok(new { available = false, message = "Username must be 3-20 characters" });
            }

            var usernameLower = username.Trim().ToLowerInvariant();
            if (!System.Text.RegularExpressions.Regex.IsMatch(usernameLower, @"^[a-z0-9_-]+$"))
            {
                return Ok(new { available = false, message = "Username can only contain letters, numbers, underscore, and hyphen" });
            }

            var exists = await _db.Users.AnyAsync(u => u.Username != null && u.Username.ToLower() == usernameLower);
            if (exists)
            {
                return Ok(new { available = false, message = "Username already taken" });
            }

            return Ok(new { available = true, message = "Username available" });
        }

        [HttpPost("validate-email")]
        public async Task<IActionResult> ValidateEmail([FromBody] TextValueDto dto)
        {
            var email = dto.Value;
            if (string.IsNullOrWhiteSpace(email) || !email.Contains("@"))
            {
                return Ok(new { available = false, message = "Invalid email format" });
            }

            var emailLower = email.Trim().ToLowerInvariant();
            var exists = await _db.Users.AnyAsync(u => u.Email == emailLower);
            if (exists)
            {
                return Ok(new { available = false, message = "Email already registered" });
            }

            return Ok(new { available = true, message = "Email available" });
        }

        [HttpPost("validate-codeforces")]
        public async Task<IActionResult> ValidateCodeforces([FromBody] TextValueDto dto)
        {
            var handle = dto.Value;
            if (string.IsNullOrWhiteSpace(handle))
            {
                return Ok(new { available = true, message = "Valid" });
            }

            var handleTrimmed = handle.Trim();
            var exists = await _db.Users.AnyAsync(u => u.CodeforceHandle == handleTrimmed);
            if (exists)
            {
                return Ok(new { available = false, message = "Codeforces handle already in use" });
            }

            return Ok(new { available = true, message = "Codeforces handle available" });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest("Username, email, and password are required.");
            }

            var usernameLower = dto.Username.Trim().ToLowerInvariant();
            if (!System.Text.RegularExpressions.Regex.IsMatch(usernameLower, @"^[a-z0-9_-]+$") || usernameLower.Length < 3 || usernameLower.Length > 20)
            {
                return BadRequest("Username must be 3-20 characters with only letters, numbers, underscore, and hyphen.");
            }

            var email = dto.Email.Trim().ToLowerInvariant();
            var usernameExists = await _db.Users.AnyAsync(u => u.Username != null && u.Username.ToLower() == usernameLower);
            if (usernameExists)
            {
                return BadRequest("Username already taken.");
            }

            var emailExists = await _db.Users.AnyAsync(u => u.Email == email);
            if (emailExists)
            {
                return BadRequest("Email already registered.");
            }

            if (!string.IsNullOrWhiteSpace(dto.CodeforceHandle))
            {
                var codeforceHandleLower = dto.CodeforceHandle.Trim();
                var handleExists = await _db.Users.AnyAsync(u => u.CodeforceHandle == codeforceHandleLower);
                if (handleExists)
                {
                    return BadRequest("Codeforces handle already in use.");
                }
            }


            var user = new UserAccount
            {
                DisplayName = string.IsNullOrWhiteSpace(dto.DisplayName) ? email.Split('@')[0] : dto.DisplayName.Trim(),
                Username = usernameLower,
                Email = email,
                University = string.IsNullOrWhiteSpace(dto.University) ? null : dto.University.Trim(),
                Department = string.IsNullOrWhiteSpace(dto.Department) ? null : dto.Department.Trim(),
                Bio = string.IsNullOrWhiteSpace(dto.Bio) ? null : dto.Bio.Trim(),
                ProfilePictureUrl = string.IsNullOrWhiteSpace(dto.ProfilePictureUrl) ? null : dto.ProfilePictureUrl.Trim(),
                CodeforceHandle = string.IsNullOrWhiteSpace(dto.CodeforceHandle) ? null : dto.CodeforceHandle.Trim(),
                LeetcodeUsername = string.IsNullOrWhiteSpace(dto.LeetcodeUsername) ? null : dto.LeetcodeUsername.Trim(),
                HackerRankHandle = string.IsNullOrWhiteSpace(dto.HackerRankHandle) ? null : dto.HackerRankHandle.Trim(),
                CodeChefHandle = string.IsNullOrWhiteSpace(dto.CodeChefHandle) ? null : dto.CodeChefHandle.Trim(),
                AtCoderHandle = string.IsNullOrWhiteSpace(dto.AtCoderHandle) ? null : dto.AtCoderHandle.Trim(),
                GithubUsername = string.IsNullOrWhiteSpace(dto.GithubUsername) ? null : dto.GithubUsername.Trim(),
                PasswordHash = HashPassword(dto.Password)
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var token = CreateToken(user);
            return Ok(new
            {
                token,
                user = new { 
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
                }
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest("Email and password are required.");
            }

            var email = dto.Email.Trim().ToLowerInvariant();
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null || user.PasswordHash != HashPassword(dto.Password))
            {
                return Unauthorized("Invalid email or password.");
            }

            var token = CreateToken(user);
            return Ok(new
            {
                token,
                user = new { 
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
                }
            });
        }

        public class RequestPasswordResetDto { public string Email { get; set; } = string.Empty; }
        public class VerifyResetOtpDto { public string Email { get; set; } = string.Empty; public string Code { get; set; } = string.Empty; }
        public class ResetPasswordDto { public string Email { get; set; } = string.Empty; public string ResetToken { get; set; } = string.Empty; public string NewPassword { get; set; } = string.Empty; }

        [HttpPost("request-password-reset")]
        public async Task<IActionResult> RequestPasswordReset([FromBody] RequestPasswordResetDto dto)
        {
            try
            {
                var email = dto.Email?.Trim().ToLowerInvariant();
                if (string.IsNullOrWhiteSpace(email)) return BadRequest("Email is required");

                var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (user == null)
                {
                    // Do not reveal whether email exists
                    return Ok(new { success = true });
                }

                // generate 6-digit code
                var rng = RandomNumberGenerator.GetInt32(0, 1000000);
                var code = rng.ToString("D6");

                var expires = DateTime.UtcNow.AddMinutes(1);

                var reset = new PasswordReset
                {
                    UserAccountId = user.Id,
                    Code = code,
                    ExpiresAt = expires,
                    Used = false,
                    Attempts = 0
                };
                _db.PasswordResets.Add(reset);
                await _db.SaveChangesAsync();

                // send OTP email
                var subject = "Your password reset code";
                var body = $"Your password reset code is: {code}\nThis code expires in 60 seconds.";
                try
                {
                    await _emailSender.SendEmailAsync(email, subject, body);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[PasswordReset] Email send failed: {ex}");
                    // We still return success to the caller to avoid revealing account existence,
                    // but log the failure so operators can see email misconfiguration.
                }

                return Ok(new { success = true, message = "OTP sent if email exists" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PasswordReset] Error: {ex}");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("verify-reset-otp")]
        public async Task<IActionResult> VerifyResetOtp([FromBody] VerifyResetOtpDto dto)
        {
            try
            {
                var email = dto.Email?.Trim().ToLowerInvariant();
                if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(dto.Code)) return BadRequest("Email and code required");

                var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (user == null) return BadRequest("Invalid code");

                var reset = await _db.PasswordResets
                    .Where(r => r.UserAccountId == user.Id && !r.Used)
                    .OrderByDescending(r => r.CreatedAt)
                    .FirstOrDefaultAsync();

                if (reset == null) return BadRequest("Invalid or expired code");
                if (reset.ExpiresAt < DateTime.UtcNow) return BadRequest("OTP expired");
                if (reset.Code != dto.Code)
                {
                    reset.Attempts++;
                    await _db.SaveChangesAsync();
                    return BadRequest("Invalid OTP");
                }

                // generate a reset token (GUID) valid for 5 minutes
                reset.ResetToken = Guid.NewGuid().ToString();
                reset.ExpiresAt = DateTime.UtcNow.AddMinutes(5);
                await _db.SaveChangesAsync();

                return Ok(new { success = true, resetToken = reset.ResetToken });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PasswordReset][verify] Error: {ex}");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            try
            {
                var email = dto.Email?.Trim().ToLowerInvariant();
                if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(dto.ResetToken) || string.IsNullOrWhiteSpace(dto.NewPassword))
                    return BadRequest("Missing fields");

                var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (user == null) return BadRequest("Invalid token");

                var reset = await _db.PasswordResets
                    .Where(r => r.UserAccountId == user.Id && !r.Used && r.ResetToken == dto.ResetToken)
                    .OrderByDescending(r => r.CreatedAt)
                    .FirstOrDefaultAsync();

                if (reset == null) return BadRequest("Invalid or used token");
                if (reset.ExpiresAt < DateTime.UtcNow) return BadRequest("Reset token expired");

                user.PasswordHash = HashPassword(dto.NewPassword);
                reset.Used = true;
                _db.Users.Update(user);
                _db.PasswordResets.Update(reset);
                await _db.SaveChangesAsync();

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PasswordReset][reset] Error: {ex}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}