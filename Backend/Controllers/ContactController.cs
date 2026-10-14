using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Linq;
using System.Text.RegularExpressions;

namespace Backend.Controllers
{
    public class ContactRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;

        // Honeypot: a hidden field real users never see or fill in.
        // Any non-empty value here means the submission came from a bot.
        public string? Website { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ContactController : ControllerBase
    {
        private static readonly Regex EmailRegex = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);
        private static readonly string[] AllowedSubjects =
        {
            "General Question", "Bug Report", "Feature Request", "Partnership", "Other"
        };

        private readonly AppDbContext _db;
        private readonly IEmailSender _emailSender;
        private readonly IConfiguration _config;
        private readonly ILogger<ContactController> _logger;

        public ContactController(AppDbContext db, IEmailSender emailSender, IConfiguration config, ILogger<ContactController> logger)
        {
            _db = db;
            _emailSender = emailSender;
            _config = config;
            _logger = logger;
        }

        [HttpPost]
        [EnableRateLimiting("contact-form")]
        public async Task<IActionResult> Submit([FromBody] ContactRequest request)
        {
            // Honeypot tripped: pretend success so bots don't learn to avoid the field, but do nothing.
            if (!string.IsNullOrEmpty(request.Website))
            {
                return Ok(new { message = "Thanks! We'll get back to you within 2-3 business days." });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { error = "Name is required." });

            if (string.IsNullOrWhiteSpace(request.Email) || !EmailRegex.IsMatch(request.Email))
                return BadRequest(new { error = "A valid email address is required." });

            if (string.IsNullOrWhiteSpace(request.Message) || request.Message.Trim().Length < 10)
                return BadRequest(new { error = "Message must be at least 10 characters." });

            var subject = AllowedSubjects.Contains(request.Subject) ? request.Subject : "Other";
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

            var entry = new ContactMessage
            {
                Name = request.Name.Trim(),
                Email = request.Email.Trim(),
                Subject = subject,
                Message = request.Message.Trim(),
                Status = "New",
                IpAddress = ip,
                SubmittedAt = DateTime.UtcNow,
            };

            _db.ContactMessages.Add(entry);
            await _db.SaveChangesAsync();

            // Best-effort notifications — the submission is already saved, so email failures don't fail the request.
            var adminEmail = _config["Contact:AdminEmail"] ?? "admin@example.com";
            try
            {
                await _emailSender.SendEmailAsync(
                    adminEmail,
                    $"[CodePulse Contact] {subject} from {entry.Name}",
                    $"From: {entry.Name} <{entry.Email}>\nSubject: {subject}\n\n{entry.Message}"
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send contact admin notification email; message {Id} was still saved.", entry.Id);
            }

            try
            {
                await _emailSender.SendEmailAsync(
                    entry.Email,
                    "We received your message — CodePulse",
                    $"Hi {entry.Name},\n\nThanks for reaching out! We've received your message and will get back to you within 2-3 business days.\n\n— The CodePulse Team"
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send contact auto-reply email for message {Id}.", entry.Id);
            }

            return Ok(new { message = "Thanks! We'll get back to you within 2-3 business days." });
        }
    }
}
