using System;

namespace AyalasLanguageAPI.Endpoints
{
    using AyalasLanguageAPI.DTOs;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.AspNetCore.Builder;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Routing;
    using AyalasLanguageAPI.Data;
    using AyalasLanguageAPI.Model;

    public static class AyalasLanguageEndpoints
    {
        public static void MapLanguageEndpoints(this IEndpointRouteBuilder app)
        {
            // User Group
            var users = app.MapGroup("/api/users").WithTags("Users");

            users.MapPost("/register", RegisterUser);
            users.MapPost("/{userId:int}/languages", AddUserLanguage);

            // Learning Group
            var learning = app.MapGroup("/api/learning").WithTags("Learning");

            learning.MapGet("/languages/{languageId:int}/path", GetLearningPath);
            learning.MapPost("/progress", UpdateUserProgress);
            learning.MapGet("/path/{pathId:int}/exercises", GetExercises);
        }

        // --- Private Handler Implementations ---

        private static async Task<IResult> RegisterUser(UserRegisterDto dto, AyalasLanguageDbContext db)
        {
            var user = new User
            {
                DisplayName = dto.DisplayName,
                UserName = dto.UserName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = 1
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Results.Created($"/api/users/{user.UserId}",
                new UserResponseDto(user.UserId, user.DisplayName, user.UserName, user.Role));
        }

        private static async Task<IResult> AddUserLanguage(int userId, SelectLanguageDto dto, AyalasLanguageDbContext db)
        {
            var userLanguage = new UserLanguage
            {
                UserId = userId,
                LanguageId = dto.LanguageId,
                IsLearning = dto.IsLearning
            };

            db.UserLanguages.Add(userLanguage);
            await db.SaveChangesAsync();
            return Results.Ok();
        }

        private static async Task<IResult> GetLearningPath(int languageId, AyalasLanguageDbContext db)
        {
            var path = await db.LearningPaths
                .Where(lp => lp.LanguageId == languageId)
                .Select(lp => new LearningPathDto(lp.LearningPathId, lp.Level, lp.Chapter, lp.Name, lp.LanguageId))
                .ToListAsync();

            return Results.Ok(path);
        }

        private static async Task<IResult> UpdateUserProgress(int userId, UpdateProgressDto dto, AyalasLanguageDbContext db)
        {
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

        private static async Task<IResult> GetExercises(int pathId, AyalasLanguageDbContext db)
        {
            var exercises = await db.Exercises
                .Where(e => e.LearningPathId == pathId)
                .Select(e => new ExerciseDto(e.ExerciseId, e.ExerciseTypeId, e.Data))
                .ToListAsync();

            return Results.Ok(exercises);
        }
    }
}