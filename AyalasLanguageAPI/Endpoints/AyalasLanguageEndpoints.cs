using System;
using BCrypt.Net;

namespace AyalasLanguageAPI.Endpoints
{
    using AyalasLanguageAPI.DTOs;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.AspNetCore.Builder;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Routing;
    using AyalasLanguageAPI.Data;
    using AyalasLanguageAPI.Model;
    using Microsoft.Extensions.Caching.Memory;
    using System.Security.Claims;
    using AyalasLanguageAPI.Auth;
    using Microsoft.AspNetCore.Authorization;

    public static class AyalasLanguageEndpoints
    {
        public static void MapLanguageEndpoints(this IEndpointRouteBuilder app)
        {
            // User Group
            var auth = app.MapGroup("/api/auth").WithTags("Auth");

            auth.MapPost("/login", LoginUser);
            auth.MapPost("/register", RegisterUser);

            var baseAPI = app.MapGroup("/api").WithTags("BaseAPI");
            // Protected endpoints (require authentication)
            baseAPI.MapPost("/profile", EditUserProfile);
            baseAPI.MapPost("/current", SwitchUserLanguages);
            baseAPI.MapGet("/current", GetUserCurrentLearning);

            // Learning Group
            var learning = app.MapGroup("/api/learning").WithTags("Learning");
            learning.MapGet("/languages/{languageId:int}/path", GetLearningPath);
            learning.MapGet("/path/{pathId:int}/exercises", GetExercises);
            learning.MapPost("/progress", UpdateUserProgress);

            // Static Data Group
            var staticData = app.MapGroup("/api/static").WithTags("Static");

            staticData.MapGet("/languages", GetLanguages);

        }

        // --- Private Handler Implementations ---
        private static async Task<IResult> LoginUser(LoginRequest login, IConfiguration config, AyalasLanguageDbContext db, IMemoryCache cache)
        {
            // 1. Find user (In production, use a proper password hasher!)
            var user = await db.Users.FirstOrDefaultAsync(u => u.UserName == login.UserName);
            if (user == null || !BCrypt.Net.BCrypt.Verify(login.Password, user.PasswordHash))
                return Results.Unauthorized();

            // 2. Generate a unique token: improve this in production (e.g. JWT or GUID + HMAC)
            var tokenContent = TokenGenerator.GenerateToken(); // Implement a secure token generator
            var expires = DateTime.UtcNow.AddHours(config.GetValue<int>("Session:TokenExpirationHours"));

            var tokenEntry = new Token
            {
                UserId = user.UserId,
                Content = tokenContent,
                ExpiresOn = expires
            };

            // 3. Save to DB (for persistence/audit)
            db.Tokens.Add(tokenEntry);
            await db.SaveChangesAsync();

            // 4. Cache the User object keyed by the Token Content
            // We cache the User so we don't have to query the DB in the middleware
            cache.Set(tokenContent, user, expires);

            return Results.Ok(new { token = tokenContent, expires });
    }

        private static async Task<IResult> RegisterUser(UserRegisterDto dto, AyalasLanguageDbContext db)
        {

            if (await db.Users.FirstOrDefaultAsync(u => u.UserName == dto.UserName) != null)
            {
                return Results.Conflict("Username already exists.");
            }

            var user = new User
            {
                DisplayName = dto.DisplayName,
                UserName = dto.UserName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = (byte)UserRoleEnum.ContentCreator
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Results.Created($"/api/users/{user.UserId}",
                new UserResponseDto(user.UserId, user.DisplayName, user.UserName, user.Role));
        }
        [Authorize]
        private static async Task<IResult> GetUserProfile(ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var user = await db.Users
                .Include(u => u.UserLanguages)
                .Include(u => u.UserExerciseTypes)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null) return Results.NotFound();

            var profile = new UserProfileDto(
                user.DisplayName,
                user.UserLanguages.Select(ul => new UserLanguageDto(ul.LanguageId, ul.IsLearning)).ToList(),
                user.UserExerciseTypes.Select(ue => new UserExerciseTypeDto(ue.ExerciseTypeId)).ToList()
            );

            return Results.Ok(profile);
        }
        [Authorize]
        private static async Task<SwitchLanguageDto> GetUserCurrentLearning(ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var user = await db.Users.FindAsync(userId);
            if (user == null) return null!;

            return new SwitchLanguageDto(user.TargetLanguageId, user.KnownLanguageId);
        }
        [Authorize]
        private static async Task<IResult> SwitchUserLanguages(ClaimsPrincipal claim, SwitchLanguageDto dto, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var user = await db.Users.FindAsync(userId);
            if (user == null) return Results.NotFound();

            if (dto.TargetLanguageId == null || dto.KnownLanguageId == null)
            {
                return Results.BadRequest("User must have both target and known languages set to switch.");
            }

            await AddLanguageToUser(userId, dto.TargetLanguageId.Value, true, db);
            await AddLanguageToUser(userId, dto.KnownLanguageId.Value, false, db);

            user.TargetLanguageId = dto.TargetLanguageId;
            user.KnownLanguageId = dto.KnownLanguageId;

            await db.SaveChangesAsync();
            return Results.Ok(dto);
        }
        [Authorize]
        private static async Task<IResult> EditUserProfile(ClaimsPrincipal claim, EditUserProfileDto dto, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var user = await db.Users
                .Include(u => u.UserLanguages)
                .Include(u => u.UserExerciseTypes)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null) return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(dto.DisplayName))
            {
                user.DisplayName = dto.DisplayName;
            }
            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            }

            var existingLangs = user.UserLanguages.ToList();
            var existingExerciseTypes = user.UserExerciseTypes.ToList();

            foreach (var lang in dto.Languages)
            {
                var existing = existingLangs
                    .FirstOrDefault(ul => ul.UserId == userId && ul.LanguageId == lang.LanguageId);

                if (existing != null)
                {
                    existing.IsLearning = lang.IsLearning;
                }
                else
                {
                    db.UserLanguages.Add(new UserLanguage
                    {
                        UserId = userId,
                        LanguageId = lang.LanguageId,
                        IsLearning = lang.IsLearning
                    });
                }
            }
            foreach (var existing in existingLangs)
            {
                if (!dto.Languages.Any(l => l.LanguageId == existing.LanguageId))
                {
                    db.UserLanguages.Remove(existing);
                }
            }

            foreach (var exType in dto.ExerciseTypes)
            {
                var existing = existingExerciseTypes
                    .FirstOrDefault(ue => ue.UserId == userId && ue.ExerciseTypeId == exType.ExerciseTypeId);

                if (existing == null)
                {
                    db.UserExerciseTypes.Add(new UserExerciseType
                    {
                        UserId = userId,
                        ExerciseTypeId = exType.ExerciseTypeId
                    });
                }
            }
            foreach (var existing in existingExerciseTypes)
            {
                if (!dto.ExerciseTypes.Any(e => e.ExerciseTypeId == existing.ExerciseTypeId))
                {
                    db.UserExerciseTypes.Remove(existing);
                }
            }

            await db.SaveChangesAsync();
            return Results.Ok();
        }
        
        //helper function to add or update a user's language preference
        private static async Task AddLanguageToUser(int userId, int languageId, bool isLearning, AyalasLanguageDbContext db)
        {
            var existing = await db.UserLanguages
                .FirstOrDefaultAsync(ul => ul.UserId == userId && ul.LanguageId == languageId);

            if (existing != null)
            {
                existing.IsLearning = isLearning;
            }
            else
            {
                db.UserLanguages.Add(new UserLanguage
                {
                    UserId = userId,
                    LanguageId = languageId,
                    IsLearning = isLearning
                });
            }
        }

        [Authorize]
        private static async Task<IResult> GetLearningPath(int languageId, ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var learningPathsWithStatus = await db.LearningPaths
            .Where(lp => lp.LanguageId == languageId)
            .GroupJoin(
                db.UserProgresses.Where(up => up.UserId == userId),
                path => path.LearningPathId,
                progress => progress.LearningPathId,
                (path, progressGroup) => new LearningPathDto
                (
                    path.LearningPathId,
                    path.Level,
                    path.Chapter,
                    path.Name,
                    path.LanguageId,
                    progressGroup.Select(p => (byte?)p.Status).FirstOrDefault() ?? 0
                )
            )
            .ToListAsync();

            return Results.Ok(learningPathsWithStatus);
        }

        [Authorize]
        private static async Task<IResult> UpdateUserProgress(ClaimsPrincipal claim, UpdateProgressDto dto, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var progress = await db.UserProgresses
                .FirstOrDefaultAsync(p => p.UserId == userId && p.LearningPathId == dto.LearningPathId);

            if (progress == null)
            {
                db.UserProgresses.Add(new UserProgress
                {
                    UserId = userId,
                    LanguageId = dto.LanguageId,
                    LearningPathId = dto.LearningPathId,
                    Status = dto.Status
                });
            }
            else
            {
                progress.Status = dto.Status;
            }

            await db.SaveChangesAsync();
            return Results.NoContent();
        }

        [Authorize]
        private static async Task<IResult> GetExercises(int pathId, ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            //get user exercise types
            var userExerciseTypes = await db.UserExerciseTypes.Where(ue => ue.UserId == userId).Select(ue => ue.ExerciseTypeId).ToListAsync();

            //get all exercise types if user has not specified any
            if (!userExerciseTypes.Any())
            {
                userExerciseTypes = await db.ExerciseTypes.Select(et => et.ExerciseTypeId).ToListAsync();
            }

            //Filter exercises by path and user exercise types
            var exercises = await db.Exercises
                .Where(e => e.LearningPathId == pathId && userExerciseTypes.Contains(e.ExerciseTypeId))
                .Select(e => new ExerciseDto(e.ExerciseId, e.ExerciseTypeId, e.Data))
                .ToListAsync();

            return Results.Ok(exercises);
        }

        [Authorize]
        private static async Task<IResult> GetLanguages(AyalasLanguageDbContext db)
        {
            var languages = await db.Languages
                .OrderBy(l => l.EnglishName)
                .Select(l => new LanguageDto(l.LanguageId, l.Code, l.EnglishName, l.NativeName))
                .ToListAsync();

            return Results.Ok(languages);
        }
    }
}