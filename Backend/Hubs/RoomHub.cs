using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Backend.Hubs
{
    [Authorize]
    public class RoomHub : Hub
    {
        private readonly AppDbContext _db;

        public RoomHub(AppDbContext db)
        {
            _db = db;
        }

        private int GetUserId() =>
            int.Parse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

        /// <summary>
        /// Client calls this to join a room's SignalR group and receive real-time updates.
        /// </summary>
        public async Task JoinRoom(int roomId)
        {
            var userId = GetUserId();

            // Verify user is a member of this room
            var isMember = await _db.RoomMembers
                .AnyAsync(m => m.RoomId == roomId && m.UserId == userId);

            if (!isMember)
            {
                await Clients.Caller.SendAsync("Error", new { message = "Not a member of this room" });
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, $"room_{roomId}");

            var user = await _db.Users.FindAsync(userId);

            // Notify other members
            await Clients.OthersInGroup($"room_{roomId}").SendAsync("MemberJoined", new
            {
                userId,
                displayName = user?.DisplayName ?? "",
                profilePic = user?.ProfilePictureUrl,
                isOnline = true,
            });
        }

        /// <summary>
        /// Client calls this to leave a room's SignalR group.
        /// </summary>
        public async Task LeaveRoom(int roomId)
        {
            var userId = GetUserId();

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"room_{roomId}");

            await Clients.Group($"room_{roomId}").SendAsync("MemberLeft", new
            {
                userId,
            });
        }
    }
}
