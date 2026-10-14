using Backend.Data;
using Backend.Hubs;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var conn = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(conn));

// Register a typed HttpClient for external APIs with a reasonable timeout
builder.Services.AddHttpClient<IExternalContestFetcher, ExternalContestFetcher>(client =>
{
    // Fail faster on slow external endpoints during startup
    client.Timeout = TimeSpan.FromSeconds(20);
});

var jwtKey = builder.Configuration["Jwt:Key"] ?? "development-only-super-secret-key-change-me";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "CodingPlatform";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "CodingPlatformUsers";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };

        // Allow SignalR to receive JWT from query string (WebSocket can't send headers)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// CORS — must use AllowCredentials() for SignalR WebSocket transport
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy
        .WithOrigins("http://localhost:3000", "http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

// Register email sender
builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();

// Rate limit the public contact form to 5 submissions per IP per hour
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("contact-form", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromHours(1),
                QueueLimit = 0,
            }));
});

// Register room services
builder.Services.AddScoped<ThreadLockService>();

// SignalR
builder.Services.AddSignalR();

// Background timer service for server-authoritative room timers
builder.Services.AddHostedService<RoomTimerService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
        app.MapOpenApi();
    app.MapGet("/swagger/index.html", () => Results.Redirect("/swagger"));
        app.MapGet("/swagger", () => Results.Content(@"<!doctype html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <title>CodePulse Swagger</title>
    <link rel='stylesheet' href='https://unpkg.com/swagger-ui-dist@5/swagger-ui.css' />
    <style>html,body{margin:0;height:100%;background:#0f172a}</style>
</head>
<body>
    <div id='swagger-ui'></div>
    <script src='https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js'></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: '/openapi/v1.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [SwaggerUIBundle.presets.apis],
                layout: 'BaseLayout'
            });
        };
    </script>
</body>
</html>", "text/html"));
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

// Map SignalR hub
app.MapHub<RoomHub>("/hubs/room");

// Ensure DB created and start seeding in background (don't block startup)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    await EnsureSchemaAsync(db);

    // Start seeding in a background task so the app can finish startup quickly.
    var appServices = app.Services;
    var startupLogger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    _ = Task.Run(async () =>
    {
        try
        {
            using var bgScope = appServices.CreateScope();
            var bgDb = bgScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var fetcher = bgScope.ServiceProvider.GetRequiredService<IExternalContestFetcher>();
            var logger = bgScope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("Starting background contest seeding...");
            await ContestSeeder.SeedAsync(bgDb, fetcher);
            logger.LogInformation("Background contest seeding completed.");

            logger.LogInformation("Starting game questions seeding...");
            await GameSeeder.SeedQuestionsAsync(bgDb);
            logger.LogInformation("Game questions seeding completed.");
        }
        catch (Exception ex)
        {
            startupLogger.LogError(ex, "Background contest or game seeding failed");
        }
    });
}

app.Run();

static async Task EnsureSchemaAsync(AppDbContext db)
{
    const string createSchemaSql = """
        CREATE TABLE IF NOT EXISTS "Contests" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "Name" text NOT NULL,
            "Platform" text NOT NULL,
            "StartTime" timestamp with time zone NOT NULL,
            "Duration" integer NOT NULL,
            "Url" text NOT NULL,
            "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
            "ExternalId" text
        );

        CREATE TABLE IF NOT EXISTS "Users" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "DisplayName" text NOT NULL,
            "Username" text NOT NULL,
            "Email" text NOT NULL,
            "PasswordHash" text NOT NULL,
            "University" text,
            "Department" text,
            "Bio" text,
            "ProfilePictureUrl" text,
            "CodeforceHandle" text,
            "LeetcodeUsername" text,
            "HackerRankHandle" text,
            "CodeChefHandle" text,
            "AtCoderHandle" text,
            "GithubUsername" text,
            "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW()
        );


        CREATE TABLE IF NOT EXISTS "SavedContests" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "UserAccountId" integer NOT NULL,
            "ContestId" integer NOT NULL,
            "Status" text NOT NULL DEFAULT 'Interested',
            "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
            CONSTRAINT "FK_SavedContests_Contests_ContestId" FOREIGN KEY ("ContestId") REFERENCES "Contests" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_SavedContests_Users_UserAccountId" FOREIGN KEY ("UserAccountId") REFERENCES "Users" ("Id") ON DELETE CASCADE
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Contests_Platform_Name_StartTime" ON "Contests" ("Platform", "Name", "StartTime");
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_SavedContests_UserAccountId_ContestId" ON "SavedContests" ("UserAccountId", "ContestId");

        CREATE TABLE IF NOT EXISTS "GlobalContestStats" (
            "Id" integer PRIMARY KEY,
            "LifetimeContestCount" bigint NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS "PlatformContestStats" (
            "Platform" text PRIMARY KEY,
            "LifetimeContestCount" bigint NOT NULL DEFAULT 0
        );
        
        CREATE TABLE IF NOT EXISTS "PasswordResets" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "UserAccountId" integer NOT NULL,
            "Code" text NOT NULL,
            "ResetToken" text,
            "ExpiresAt" timestamp with time zone NOT NULL,
            "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
            "Used" boolean NOT NULL DEFAULT false,
            "Attempts" integer NOT NULL DEFAULT 0,
            CONSTRAINT "FK_PasswordResets_Users_UserAccountId" FOREIGN KEY ("UserAccountId") REFERENCES "Users" ("Id") ON DELETE CASCADE
        );

        -- ═══════════════════════════════════════════════════════════
        -- Virtual Team Practice Rooms tables
        -- ═══════════════════════════════════════════════════════════

        CREATE TABLE IF NOT EXISTS "Rooms" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "Name" text NOT NULL,
            "ContestId" integer NOT NULL,
            "HostId" integer NOT NULL,
            "StartTime" timestamp with time zone NOT NULL,
            "DurationMinutes" integer NOT NULL,
            "Status" text NOT NULL DEFAULT 'Scheduled',
            "Visibility" text NOT NULL DEFAULT 'Private',
            "InviteCode" text NOT NULL,
            "MaxMembers" integer NOT NULL DEFAULT 10,
            "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
            CONSTRAINT "FK_Rooms_Contests_ContestId" FOREIGN KEY ("ContestId") REFERENCES "Contests" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_Rooms_Users_HostId" FOREIGN KEY ("HostId") REFERENCES "Users" ("Id") ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Rooms_InviteCode" ON "Rooms" ("InviteCode");

        CREATE TABLE IF NOT EXISTS "RoomMembers" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "RoomId" integer NOT NULL,
            "UserId" integer NOT NULL,
            "JoinedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
            "Role" text NOT NULL DEFAULT 'Member',
            CONSTRAINT "FK_RoomMembers_Rooms_RoomId" FOREIGN KEY ("RoomId") REFERENCES "Rooms" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_RoomMembers_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_RoomMembers_RoomId_UserId" ON "RoomMembers" ("RoomId", "UserId");

        CREATE TABLE IF NOT EXISTS "RoomProblems" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "RoomId" integer NOT NULL,
            "ProblemIndex" text NOT NULL,
            "ProblemName" text NOT NULL,
            "ProblemUrl" text NOT NULL DEFAULT '',
            "SortOrder" integer NOT NULL DEFAULT 0,
            CONSTRAINT "FK_RoomProblems_Rooms_RoomId" FOREIGN KEY ("RoomId") REFERENCES "Rooms" ("Id") ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS "RoomProgress" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "RoomId" integer NOT NULL,
            "UserId" integer NOT NULL,
            "RoomProblemId" integer NOT NULL,
            "Status" text NOT NULL DEFAULT 'Unattempted',
            "SolvedAt" timestamp with time zone,
            "Attempts" integer NOT NULL DEFAULT 0,
            CONSTRAINT "FK_RoomProgress_Rooms_RoomId" FOREIGN KEY ("RoomId") REFERENCES "Rooms" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_RoomProgress_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_RoomProgress_RoomProblems_RoomProblemId" FOREIGN KEY ("RoomProblemId") REFERENCES "RoomProblems" ("Id") ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_RoomProgress_RoomId_UserId_ProblemId" ON "RoomProgress" ("RoomId", "UserId", "RoomProblemId");

        CREATE TABLE IF NOT EXISTS "RoomMessages" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "RoomId" integer NOT NULL,
            "RoomProblemId" integer,
            "UserId" integer NOT NULL,
            "Content" text NOT NULL DEFAULT '',
            "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
            "ParentMessageId" integer,
            CONSTRAINT "FK_RoomMessages_Rooms_RoomId" FOREIGN KEY ("RoomId") REFERENCES "Rooms" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_RoomMessages_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_RoomMessages_RoomProblems_RoomProblemId" FOREIGN KEY ("RoomProblemId") REFERENCES "RoomProblems" ("Id") ON DELETE SET NULL,
            CONSTRAINT "FK_RoomMessages_RoomMessages_ParentMessageId" FOREIGN KEY ("ParentMessageId") REFERENCES "RoomMessages" ("Id") ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS "ComplexityQuestions" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "CodeSnippet" text NOT NULL,
            "Language" text NOT NULL,
            "CorrectAnswer" text NOT NULL,
            "OptionsRaw" text NOT NULL,
            "Difficulty" text NOT NULL,
            "Explanation" text NOT NULL
        );

        CREATE TABLE IF NOT EXISTS "UserGameScores" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "UserId" integer NOT NULL,
            "GameType" text NOT NULL DEFAULT 'complexity_guess',
            "TotalCorrect" integer NOT NULL DEFAULT 0,
            "TotalAttempted" integer NOT NULL DEFAULT 0,
            "BestStreak" integer NOT NULL DEFAULT 0,
            "LastPlayedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
            CONSTRAINT "FK_UserGameScores_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserGameScores_UserId_GameType" ON "UserGameScores" ("UserId", "GameType");

        CREATE TABLE IF NOT EXISTS "BrainGymHistory" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "UserId" integer NOT NULL,
            "GameType" text NOT NULL DEFAULT 'complexity_guess',
            "Score" integer NOT NULL DEFAULT 0,
            "Accuracy" double precision NOT NULL DEFAULT 0,
            "PlayedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
            CONSTRAINT "FK_BrainGymHistory_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS "Games" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "GameKey" text NOT NULL,
            "Name" text NOT NULL,
            "Category" text NOT NULL,
            "Description" text NOT NULL,
            "IconKey" text NOT NULL,
            "IsActive" boolean NOT NULL DEFAULT true
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Games_GameKey" ON "Games" ("GameKey");

        CREATE TABLE IF NOT EXISTS "GameQuestions" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "GameId" integer NOT NULL,
            "Content" text NOT NULL,
            "Difficulty" text NOT NULL,
            CONSTRAINT "FK_GameQuestions_Games_GameId" FOREIGN KEY ("GameId") REFERENCES "Games" ("Id") ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS "ContactMessages" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "Name" text NOT NULL,
            "Email" text NOT NULL,
            "Subject" text NOT NULL,
            "Message" text NOT NULL,
            "Status" text NOT NULL DEFAULT 'New',
            "IpAddress" text,
            "SubmittedAt" timestamp with time zone NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS "IX_ContactMessages_SubmittedAt" ON "ContactMessages" ("SubmittedAt");
        """;

    await db.Database.ExecuteSqlRawAsync(createSchemaSql);
    // Ensure new columns exist on existing installations
    const string alterSchemaSql = """
        ALTER TABLE IF EXISTS "Contests" ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW();
        ALTER TABLE IF EXISTS "Contests" ADD COLUMN IF NOT EXISTS "ExternalId" text;
        ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS "Username" text;
        ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS "University" text;
        ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS "Department" text;
        ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS "Bio" text;
        ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS "ProfilePictureUrl" text;
        ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS "CodeforceHandle" text;
        ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS "LeetcodeUsername" text;
        ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS "HackerRankHandle" text;
        ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS "CodeChefHandle" text;
        ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS "AtCoderHandle" text;
        ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS "GithubUsername" text;
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Username" ON "Users" ("Username");
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_CodeforceHandle" ON "Users" ("CodeforceHandle");
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Contests_Platform_Name_StartTime" ON "Contests" ("Platform", "Name", "StartTime");
        
        CREATE TABLE IF NOT EXISTS "GlobalContestStats" (
            "Id" integer PRIMARY KEY,
            "LifetimeContestCount" bigint NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS "PlatformContestStats" (
            "Platform" text PRIMARY KEY,
            "LifetimeContestCount" bigint NOT NULL DEFAULT 0
        );

        -- Master games seeding
        INSERT INTO "Games" ("GameKey", "Name", "Category", "Description", "IconKey", "IsActive")
        VALUES 
        ('complexity_guess', 'Complexity Quiz', 'Speed & Recall', 'Guess the time complexity of the given code snippets under time pressure!', 'complexity', true),
        ('debug_the_code', 'Debug the Code', 'Code Reading', 'Find and fix the bugs in the provided code snippets!', 'debug', true),
        ('logic_ladder', 'Logic Puzzle Ladder', 'Pure Logic', 'Climb the ladder by solving increasingly difficult logic grid puzzles!', 'ladder', true)
        ON CONFLICT ("GameKey") DO NOTHING;

        -- Columns adaptation
        ALTER TABLE IF EXISTS "UserGameScores" ADD COLUMN IF NOT EXISTS "GameId" integer;
        UPDATE "UserGameScores"
        SET "GameId" = (SELECT "Id" FROM "Games" WHERE "GameKey" = 'complexity_guess')
        WHERE "GameId" IS NULL;

        ALTER TABLE IF EXISTS "BrainGymHistory" ADD COLUMN IF NOT EXISTS "GameId" integer;
        UPDATE "BrainGymHistory"
        SET "GameId" = (SELECT "Id" FROM "Games" WHERE "GameKey" = 'complexity_guess')
        WHERE "GameId" IS NULL;

        ALTER TABLE IF EXISTS "UserGameScores" ALTER COLUMN "GameId" SET NOT NULL;
        ALTER TABLE IF EXISTS "BrainGymHistory" ALTER COLUMN "GameId" SET NOT NULL;

        -- Foreign keys checks
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_UserGameScores_Games_GameId'
            ) THEN
                ALTER TABLE "UserGameScores" 
                ADD CONSTRAINT "FK_UserGameScores_Games_GameId" 
                FOREIGN KEY ("GameId") REFERENCES "Games" ("Id") ON DELETE CASCADE;
            END IF;
        END $$;

        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_BrainGymHistory_Games_GameId'
            ) THEN
                ALTER TABLE "BrainGymHistory" 
                ADD CONSTRAINT "FK_BrainGymHistory_Games_GameId" 
                FOREIGN KEY ("GameId") REFERENCES "Games" ("Id") ON DELETE CASCADE;
            END IF;
        END $$;

        DROP INDEX IF EXISTS "IX_UserGameScores_UserId_GameType";
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserGameScores_UserId_GameId" ON "UserGameScores" ("UserId", "GameId");

        -- Migrate complexity questions to generic game questions
        INSERT INTO "GameQuestions" ("GameId", "Content", "Difficulty")
        SELECT 
            (SELECT "Id" FROM "Games" WHERE "GameKey" = 'complexity_guess'),
            json_build_object(
                'codeSnippet', cq."CodeSnippet",
                'language', cq."Language",
                'correctAnswer', cq."CorrectAnswer",
                'optionsRaw', cq."OptionsRaw",
                'explanation', cq."Explanation"
            )::text,
            cq."Difficulty"
        FROM "ComplexityQuestions" cq
        WHERE NOT EXISTS (
            SELECT 1 FROM "GameQuestions" gq 
            WHERE gq."GameId" = (SELECT "Id" FROM "Games" WHERE "GameKey" = 'complexity_guess')
        );
    """;

    await db.Database.ExecuteSqlRawAsync(alterSchemaSql);
}
