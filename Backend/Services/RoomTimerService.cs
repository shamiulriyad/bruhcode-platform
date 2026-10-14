using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Services
{
    /// <summary>
    /// Background service that runs every second to:
    ///   - Broadcast server-authoritative timer to all active Live rooms
    ///   - Transition Scheduled → Live when StartTime arrives
    ///   - Transition Live → Ended when duration expires
    ///   - (Future) Send reminder notifications 30min / 5min before start
    /// </summary>
    public class RoomTimerService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<RoomTimerService> _logger;

        public RoomTimerService(IServiceScopeFactory scopeFactory, ILogger<RoomTimerService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("RoomTimerService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await TickAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in RoomTimerService tick");
                }

                await Task.Delay(1000, stoppingToken);
            }
        }

        private async Task TickAsync(CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<Backend.Hubs.RoomHub>>();

            var now = DateTime.UtcNow;

            // 1. Transition Scheduled → Live
            var roomsToStart = await db.Rooms
                .Where(r => r.Status == RoomStatus.Scheduled && r.StartTime <= now)
                .ToListAsync(ct);

            foreach (var room in roomsToStart)
            {
                room.Status = RoomStatus.Live;
                _logger.LogInformation("Room {RoomId} '{RoomName}' transitioned to Live", room.Id, room.Name);

                await hubContext.Clients
                    .Group($"room_{room.Id}")
                    .SendAsync("RoomStatusChanged", new { status = "Live" }, ct);
            }

            // 2. Transition Live → Ended
            var roomsToEnd = await db.Rooms
                .Where(r => r.Status == RoomStatus.Live)
                .ToListAsync(ct);

            foreach (var room in roomsToEnd)
            {
                var endTime = room.StartTime.AddMinutes(room.DurationMinutes);
                if (now >= endTime)
                {
                    room.Status = RoomStatus.Ended;
                    _logger.LogInformation("Room {RoomId} '{RoomName}' transitioned to Ended", room.Id, room.Name);

                    await hubContext.Clients
                        .Group($"room_{room.Id}")
                        .SendAsync("RoomStatusChanged", new { status = "Ended" }, ct);
                }
            }

            if (roomsToStart.Any() || roomsToEnd.Any(r => r.Status == RoomStatus.Ended))
            {
                await db.SaveChangesAsync(ct);
            }

            // 3. Broadcast TimerSync to all Live rooms
            var liveRooms = await db.Rooms
                .Where(r => r.Status == RoomStatus.Live)
                .Select(r => new { r.Id, r.StartTime, r.DurationMinutes })
                .ToListAsync(ct);

            foreach (var room in liveRooms)
            {
                var endTime = room.StartTime.AddMinutes(room.DurationMinutes);
                var remainingSeconds = Math.Max(0, (int)(endTime - now).TotalSeconds);

                await hubContext.Clients
                    .Group($"room_{room.Id}")
                    .SendAsync("TimerSync", new
                    {
                        remainingSeconds,
                        totalSeconds = room.DurationMinutes * 60,
                        status = "Live"
                    }, ct);
            }

            // 4. Broadcast countdown for Scheduled rooms (lobby countdown)
            var scheduledRooms = await db.Rooms
                .Where(r => r.Status == RoomStatus.Scheduled && r.StartTime > now)
                .Select(r => new { r.Id, r.StartTime, r.DurationMinutes })
                .ToListAsync(ct);

            foreach (var room in scheduledRooms)
            {
                var secondsUntilStart = Math.Max(0, (int)(room.StartTime - now).TotalSeconds);

                await hubContext.Clients
                    .Group($"room_{room.Id}")
                    .SendAsync("TimerSync", new
                    {
                        remainingSeconds = secondsUntilStart,
                        totalSeconds = (int)(room.StartTime - room.StartTime.AddMinutes(-room.DurationMinutes)).TotalSeconds,
                        status = "Scheduled"
                    }, ct);
            }
        }
    }
}
