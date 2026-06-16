using System;
using System.Security.Claims;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Data.Model;
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
            profileGroup.MapGet("/current", GetCurrentLanguage);
            profileGroup.MapDelete("/{languageId:int}", DeleteOtherLanguage);
            profileGroup.MapPost("/score", AddScoreToUser);
            profileGroup.MapPost("/message", CreateUserContactUs);
        }

        [Authorize]
        private static async Task<CurrentLanguageResponseDto?> GetCurrentLanguage(ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var userDto = await AuthEndpoints.GetUserById(userId, db);
            return userDto != null ? userDto.languageSettings : null;
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
                user.UserExerciseTypes.Select(ue => new UserExerciseTypeDto(ue.ExerciseTypeId)).ToList(),
                new SwitchLanguageDto(user.TargetLanguageId, user.KnownLanguageId)
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
            return Results.Ok();
        }

        [Authorize]
        private static async Task<IResult> DeleteOtherLanguage(int languageId, ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            if (languageId <= 0)
            {
                return Results.BadRequest("invalid langauge id.");
            }
            var userId = claim.GetUserId();
            var user = await db.Users.FindAsync(userId);
            if (user == null) return Results.NotFound("user not found");

            if (user.TargetLanguageId == languageId)
            {
                return Results.Conflict("Must not delete current langauge for user.");
            }

            var userLanguage = await db.UserLanguages.FirstOrDefaultAsync(ul => ul.LanguageId == languageId &&
                ul.UserId == userId && ul.IsLearning == true);

            if (userLanguage == null)
            {
                return Results.BadRequest($"Langauge {languageId} is not an other langauge for user {userId}.");
            }

            db.UserLanguages.Remove(userLanguage);
            await db.SaveChangesAsync();

            return Results.Ok();
        }

        [Authorize]
        public static async Task<IResult> AddScoreToUser(ClaimsPrincipal claim, AddScoreDto dto, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var user = await db.Users.FindAsync(userId);
            if (user == null) return Results.NotFound();

            if (user.TargetLanguageId == null)
            {
                return Results.BadRequest("User does not have a target language set.");
            }
            UserLanguage? userLanguage = await db.UserLanguages.FirstOrDefaultAsync(ul => ul.UserId == userId && ul.LanguageId == user.TargetLanguageId.Value && ul.IsLearning == true);
            if (userLanguage == null) return Results.BadRequest("User does not have a target learning language set.");

            userLanguage.Score += dto.ScoreToAdd;
            await db.SaveChangesAsync();
            UserIdDto? userIdDto = await AuthEndpoints.GetUserById(user.UserId, db);
            return Results.Ok(userIdDto?.languageSettings);
        }

        [Authorize]
        public static async Task<IResult> CreateUserContactUs(UserContactUsDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db)
        {
            var userId = claim.GetUserId();
            var user = await db.Users.FindAsync(userId);
            if (user == null) return Results.NotFound();

            ContactUs rec = new()
            {
                UserId = userId,
                Email = user.UserName,
                Message = dto.Message
            };
            db.ContactUs.Add(rec);
            await db.SaveChangesAsync();

            return Results.Ok();
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
