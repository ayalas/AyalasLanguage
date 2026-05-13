using System;
using System.Security.Claims;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageAPI.Endpoints.Profile
{
    public static class ProfileEndpoints
    {
        public static void MapProfileEndpoints(this IEndpointRouteBuilder app)
        {
            var profileGroup = app.MapGroup("/api/profile").WithTags("Profile");
            profileGroup.MapGet("/", GetUserProfile);
            profileGroup.MapPost("/", EditUserProfile);
            profileGroup.MapPost("/current", SwitchUserLanguages);
            profileGroup.MapGet("/current", GetUserCurrentLearning);
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
        private static async Task<IResult> EditUserProfile(ClaimsPrincipal claim, EditUserProfileDto dto, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var user = await db.Users
                .Include(u => u.UserLanguages)
                .Include(u => u.UserExerciseTypes)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null) return Results.NotFound();

            //if user does not have a known language, assign one here
            if (user.KnownLanguageId == null && dto.Languages.Any(l => !l.IsLearning))
            {
                var knownLang = dto.Languages.First(l => !l.IsLearning);
                user.KnownLanguageId = knownLang.LanguageId;
            }

            //if user does not have a target language, assign one here
            if (user.TargetLanguageId == null && dto.Languages.Any(l => l.IsLearning))
            {
                var targetLang = dto.Languages.First(l => l.IsLearning);
                user.TargetLanguageId = targetLang.LanguageId;
            }

            if (!string.IsNullOrWhiteSpace(dto.DisplayName))
            {
                user.DisplayName = dto.DisplayName;
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
        
            #region Helper Functions
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
        #endregion

    }
}
