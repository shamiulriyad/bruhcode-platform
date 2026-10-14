using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContestsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ContestsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _db.Contests.OrderBy(c => c.StartTime).ToListAsync();
            return Ok(items);
        }

        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcoming()
        {
            var now = DateTime.UtcNow;
            var items = await _db.Contests.Where(c => c.StartTime >= now).OrderBy(c => c.StartTime).ToListAsync();
            return Ok(items);
        }

        [HttpGet("filter")]
        public async Task<IActionResult> Filter([FromQuery] string? platform, [FromQuery] string? difficulty, [FromQuery] DateTime? date)
        {
            var query = _db.Contests.AsQueryable();
            if (!string.IsNullOrWhiteSpace(platform))
            {
                query = query.Where(c => c.Platform == platform);
            }
            if (!string.IsNullOrWhiteSpace(difficulty))
            {
                query = difficulty.ToLower() switch
                {
                    "beginner" => query.Where(c => c.Name.Contains("Div. 3", StringComparison.OrdinalIgnoreCase)),
                    "intermediate" => query.Where(c => c.Name.Contains("Div. 2", StringComparison.OrdinalIgnoreCase)),
                    "advanced" => query.Where(c => !c.Name.Contains("Div. 2", StringComparison.OrdinalIgnoreCase) && !c.Name.Contains("Div. 3", StringComparison.OrdinalIgnoreCase)),
                    _ => query
                };
            }
            if (date.HasValue)
            {
                var start = date.Value.Date;
                var end = start.AddDays(1);
                query = query.Where(c => c.StartTime >= start && c.StartTime < end);
            }

            var items = await query.OrderBy(c => c.StartTime).ToListAsync();
            return Ok(items);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var contest = await _db.Contests.FindAsync(id);
            if (contest == null) return NotFound();
            return Ok(contest);
        }
    }
}
