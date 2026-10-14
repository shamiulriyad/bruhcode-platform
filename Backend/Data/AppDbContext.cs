using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<GlobalContestStat>().HasKey(x => x.Id);
            modelBuilder.Entity<PlatformContestStat>().HasKey(x => x.Platform);

            // Room entities configuration
            modelBuilder.Entity<RoomMember>()
                .HasIndex(rm => new { rm.RoomId, rm.UserId })
                .IsUnique();

            modelBuilder.Entity<RoomProgress>()
                .HasIndex(rp => new { rp.RoomId, rp.UserId, rp.RoomProblemId })
                .IsUnique();

            modelBuilder.Entity<Room>()
                .HasIndex(r => r.InviteCode)
                .IsUnique();

            // Store enums as strings for readability
            modelBuilder.Entity<Room>()
                .Property(r => r.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Room>()
                .Property(r => r.Visibility)
                .HasConversion<string>();

            modelBuilder.Entity<RoomMember>()
                .Property(rm => rm.Role)
                .HasConversion<string>();

            modelBuilder.Entity<RoomProgress>()
                .Property(rp => rp.Status)
                .HasConversion<string>();

            // Brain Gym: one score row per user per game
            modelBuilder.Entity<UserGameScore>()
                .HasIndex(s => new { s.UserId, s.GameId })
                .IsUnique();
        }

        public DbSet<Contest> Contests { get; set; } = null!;
        public DbSet<UserAccount> Users { get; set; } = null!;
        public DbSet<SavedContest> SavedContests { get; set; } = null!;
        public DbSet<GlobalContestStat> GlobalContestStats { get; set; } = null!;
        public DbSet<PlatformContestStat> PlatformContestStats { get; set; } = null!;
        public DbSet<PasswordReset> PasswordResets { get; set; } = null!;
        public DbSet<ContactMessage> ContactMessages { get; set; } = null!;

        // Practice Rooms
        public DbSet<Room> Rooms { get; set; } = null!;
        public DbSet<RoomMember> RoomMembers { get; set; } = null!;
        public DbSet<RoomProblem> RoomProblems { get; set; } = null!;
        public DbSet<RoomProgress> RoomProgress { get; set; } = null!;
        public DbSet<RoomMessage> RoomMessages { get; set; } = null!;

        // Brain Gym
        public DbSet<Game> Games { get; set; } = null!;
        public DbSet<GameQuestion> GameQuestions { get; set; } = null!;
        public DbSet<UserGameScore> UserGameScores { get; set; } = null!;
        public DbSet<BrainGymHistory> BrainGymHistory { get; set; } = null!;
    }
}
