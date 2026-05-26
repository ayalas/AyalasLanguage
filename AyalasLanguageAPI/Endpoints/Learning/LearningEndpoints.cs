using System;
using System.Security.Claims;
using System.Xml;
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
        learning.MapGet("/path/{pathId:int}", GetSingleLearningPath);
        learning.MapGet("/path/{pathId:int}/exercises", GetExercises);
        learning.MapPost("/progress", UpdateUserProgress);
        learning.MapDelete("/progress/{pathId:int}", DeleteUserProgress);
    }

    [Authorize]
    private static async Task<IResult> GetSingleLearningPath(int pathId, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();

        return Results.Ok( await db.LearningPaths
        .Where(lp => lp.LearningPathId == pathId)
        .LeftJoin(db.UserProgresses.Where(up => up.UserId == userId),
            lp => lp.LearningPathId,
            up => up.LearningPathId,
            (lp, up) => new LearningPathSingleDto
            (
                lp.LearningPathId,
                lp.Level,
                lp.Chapter,
                lp.Name,
                up == null ? (byte)UserProgressEnum.NotStarted : up.ExerciseId == null ? (byte)UserProgressEnum.Done : (byte)UserProgressEnum.InProgress,
                up == null ? null : up.ExerciseId,
                db.Exercises.Count(e => e.LearningPathId == lp.LearningPathId
                //add if we want to handle approved exercises
                //&& (e.Status == (byte)ContentStatusEnum.Approved || e.UserId == userId)
                ),
                lp.PrevLearningPathId,
                lp.NextLearningPathId,
                lp.UserId == userId? (byte)UserAccessEnum.CanEdit : (byte)UserAccessEnum.Learner
            )
        )
        .FirstOrDefaultAsync());
    }

    [Authorize]
    private static async Task<IResult> GetLearningPath(ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();

        var user = await db.Users.FindAsync(userId); // Ensure user exists
        if (user == null) return Results.NotFound();

        if (user.TargetLanguageId == null || user.KnownLanguageId == null)
        {
            return Results.BadRequest("User does not have a target language set.");
        }

        int languageId = user.TargetLanguageId.Value;

        var learningPathsWithStatus = await db.LearningPaths
        .Where(lp => lp.TargetLanguageId == languageId && lp.KnownLanguageId == user.KnownLanguageId.Value)
        .LeftJoin(db.UserProgresses.Where(up => up.UserId == userId),
            lp => lp.LearningPathId,
            up => up.LearningPathId,
            (lp, up) => new LearningPathDto
            (
                lp.LearningPathId,
                lp.Level,
                lp.Chapter,
                lp.Name,
                up == null? (byte)UserProgressEnum.NotStarted : up.ExerciseId == null ? (byte)UserProgressEnum.Done : (byte)UserProgressEnum.InProgress,
                db.Exercises.Count(e => e.LearningPathId == lp.LearningPathId),
                //add if we want to handle approved exercises
                //&& (e.Status == (byte)ContentStatusEnum.Approved || e.UserId == userId)
                lp.PrevLearningPathId,
                lp.NextLearningPathId
            )
        )
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

        int? exerciseId = null;
        if (dto.exerciseId != null && dto.exerciseId > 0)
        {
            var exercise = await db.Exercises
                .FirstOrDefaultAsync(exr => exr.ExerciseId == dto.exerciseId && exr.LearningPathId == dto.LearningPathId);
            if (exercise == null)
            {
                return Results.BadRequest("Exercise not found");
            }
            exerciseId = dto.exerciseId;
        }

        if (progress == null)
        {
            db.UserProgresses.Add(new UserProgress
            {
                UserId = userId,
                LearningPathId = dto.LearningPathId,
                ExerciseId = exerciseId
            });
            await db.SaveChangesAsync();

            return Results.Created($"/api/learning/progress/{dto.LearningPathId}", dto);
        }
        else if (progress.ExerciseId != exerciseId)
        {
            progress.ExerciseId = exerciseId;
            await db.SaveChangesAsync();

            return Results.Created($"/api/learning/progress/{dto.LearningPathId}", dto);
        }

        return Results.Ok();
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
            .Where(e => e.LearningPathId == pathId && userExerciseTypes.Contains(e.ExerciseTypeId)
            //add if we want to handle approved exercises
            //&& (e.Status == (byte)ContentStatusEnum.Approved || e.UserId == userId)
            )
            .OrderBy(e => e.ExerciseId) // Ensure consistent ordering
            .Select(e => new ExerciseDto(e.ExerciseId, e.ExerciseTypeId, e.Data,
                e.UserId == userId? (byte)UserAccessEnum.CanEdit : (byte)UserAccessEnum.Learner
            ))
            .ToListAsync();

        return Results.Ok(exercises);
    }

}
