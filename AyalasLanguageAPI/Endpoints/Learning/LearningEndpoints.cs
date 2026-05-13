using System;
using System.Security.Claims;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageAPI.Endpoints.Learning;

public static class LearningEndpoints
{
    public static void MapLearningEndpoints(this IEndpointRouteBuilder app)
    {
        var learning = app.MapGroup("/api/learning").WithTags("Learning");
        learning.MapGet("/path", GetLearningPath);
        learning.MapGet("/path/{pathId:int}/exercises", GetExercises);
        learning.MapPost("/progress", UpdateUserProgress);
        learning.MapDelete("/progress/{pathId:int}", DeleteUserProgress);
    }

    [Authorize]
    private static async Task<IResult> GetLearningPath(ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();

        var user = await db.Users.FindAsync(userId); // Ensure user exists
        if (user == null) return Results.NotFound();

        if (user.TargetLanguageId == null)
        {
            return Results.BadRequest("User does not have a target language set.");
        }

        int languageId = user.TargetLanguageId.Value;

        var learningPathsWithStatus = await db.LearningPaths
        .Where(lp => lp.LanguageId == languageId)
        .Select(path => new LearningPathDto
        (
            path.LearningPathId,
            path.Level,
            path.Chapter,
            path.Name,
            // Check if ANY progress exists for this user and path
            db.UserProgresses.Any(up => up.UserId == userId && up.LearningPathId == path.LearningPathId)
                ? (byte)1
                : (byte)0,
            db.Exercises.Count(e => e.LearningPathId == path.LearningPathId),
            path.PrevLearningPathId,
            path.NextLearningPathId
        ))
        .ToListAsync();

        // 2. Reorder the list based on PrevLearningPathId
        try
        {
            var sortedPaths = new List<LearningPathDto>();
            Dictionary<long, LearningPathDto> pathMap = learningPathsWithStatus.ToDictionary(lp => lp.PrevLearningPathId ?? (long)0); // Key is the ID it follows

            // Find the start (where PrevLearningPathId is null or 0)
            long currentPrevId = 0;

            while (pathMap.TryGetValue(currentPrevId, out var nextPath))
            {
                sortedPaths.Add(nextPath);
                currentPrevId = nextPath.LearningPathId; // Move to the next link in the chain
            }

            return Results.Ok(sortedPaths);
        }
        catch
        {
            // If there's a cycle or missing link, just return the unsorted list
            return Results.Ok(learningPathsWithStatus);
        }
    }

    [Authorize]
    private static async Task<IResult> UpdateUserProgress(UpdateProgressDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();
        var progress = await db.UserProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.LearningPathId == dto.LearningPathId);

        if (progress == null)
        {
            db.UserProgresses.Add(new UserProgress
            {
                UserId = userId,
                LearningPathId = dto.LearningPathId
            });

            await db.SaveChangesAsync();
        }

        return Results.Created($"/api/learning/progress/{dto.LearningPathId}", dto);
    }

    [Authorize]
    private static async Task<IResult> DeleteUserProgress(int pathId, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();
        var progress = await db.UserProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.LearningPathId == pathId);

        if (progress == null) return Results.NotFound();

        db.UserProgresses.Remove(progress);
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
            .OrderBy(e => e.ExerciseId) // Ensure consistent ordering
            .Select(e => new ExerciseDto(e.ExerciseId, e.ExerciseTypeId, e.Data))
            .ToListAsync();

        return Results.Ok(exercises);
    }

}
