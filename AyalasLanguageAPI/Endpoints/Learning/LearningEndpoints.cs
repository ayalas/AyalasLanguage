using System;
using System.Security.Claims;
using System.Xml;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Data.Model;
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
        learning.MapPost("/mistake", AddMistake);
        learning.MapDelete("/progress/{pathId:int}", DeleteUserProgress);
    }

    [Authorize]
    private static async Task<IResult> GetSingleLearningPath(int pathId, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();

        return Results.Ok(await db.LearningPaths
            .Where(lp => lp.LearningPathId == pathId)
            // 1. GroupJoin correlates the LearningPath with the filtered UserProgress
            .GroupJoin(
                db.UserProgresses.Where(up => up.UserId == userId),
                lp => lp.LearningPathId,
                up => up.LearningPathId,
                (lp, userProgressGroup) => new { lp, userProgressGroup }
            )
            // 2. SelectMany with DefaultIfEmpty flattens the group into a true SQL LEFT JOIN
            .SelectMany(
                x => x.userProgressGroup.DefaultIfEmpty(),
                (x, up) => new LearningPathSingleDto
                (
                    x.lp.LearningPathId,
                    x.lp.Level,
                    x.lp.Chapter,
                    x.lp.Name,
                    // EF9 cleanly translates null-coalescing and conditionals here into SQL CASE WHEN
                    up == null
                        ? (byte)UserProgressEnum.NotStarted
                        : up.ExerciseId == null
                            ? (byte)UserProgressEnum.Done
                            : (byte)UserProgressEnum.InProgress,
                    up == null ? null : up.ExerciseId,
                    // EF9 optimizes correlated subquery counts beautifully
                    db.Exercises.Count(e => e.LearningPathId == x.lp.LearningPathId),
                    x.lp.PrevLearningPathId,
                    x.lp.NextLearningPathId,
                    x.lp.UserId == userId ? (byte)UserAccessEnum.CanEdit : (byte)UserAccessEnum.Learner,
                    up != null && up.practiseMistakesInThisPath
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
    // 1. Correlate LearningPaths with the user's specific progress records
    .GroupJoin(
        db.UserProgresses.Where(up => up.UserId == userId),
        lp => lp.LearningPathId,
        up => up.LearningPathId,
        (lp, userProgressGroup) => new { lp, userProgressGroup }
    )
    // 2. Flatten the group into a true left outer join
    .SelectMany(
        x => x.userProgressGroup.DefaultIfEmpty(),
        (x, up) => new LearningPathDto
        (
            x.lp.LearningPathId,
            x.lp.Level,
            x.lp.Chapter,
            x.lp.Name,
            // EF9 translates this conditional tree perfectly into a SQL CASE WHEN statement
            up == null
                ? (byte)UserProgressEnum.NotStarted
                : up.ExerciseId == null
                    ? (byte)UserProgressEnum.Done
                    : (byte)UserProgressEnum.InProgress,
            // EF9 optimizes this into a sub-select COUNT query
            db.Exercises.Count(e => e.LearningPathId == x.lp.LearningPathId),
            x.lp.PrevLearningPathId,
            x.lp.NextLearningPathId,
            up != null && up.practiseMistakesInThisPath
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
        bool practiseMistakesInThisPath = false;

        if (dto.practiseMistakesInThisPath != null)
        {
            practiseMistakesInThisPath = dto.practiseMistakesInThisPath.Value;
        }
        else if (progress != null)
        {
            practiseMistakesInThisPath = progress.practiseMistakesInThisPath;
        }
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

        bool modified = false;
        if (progress == null)
        {
            db.UserProgresses.Add(new UserProgress
            {
                UserId = userId,
                LearningPathId = dto.LearningPathId,
                ExerciseId = exerciseId,
                practiseMistakesInThisPath = practiseMistakesInThisPath
            });
            await db.SaveChangesAsync();

            modified = true;
        }
        else if (progress.ExerciseId != exerciseId ||
                    progress.practiseMistakesInThisPath != practiseMistakesInThisPath)
        {
            progress.ExerciseId = exerciseId;
            progress.practiseMistakesInThisPath = practiseMistakesInThisPath;
            await db.SaveChangesAsync();

            modified = true;
        }

        if (practiseMistakesInThisPath)
        {
            //get the languages for this learning path 
            var learningPath = await db.LearningPaths
                .FirstOrDefaultAsync(lp => lp.LearningPathId == dto.LearningPathId);

            if (learningPath != null)
            {
                //remove this flag from other lessons for the user
                var otherMarkedProgresses = await db.UserProgresses
                    .Where(up => up.UserId == userId && up.practiseMistakesInThisPath == true
                    && up.LearningPathId != dto.LearningPathId)
                .Join(db.LearningPaths.Where(lp => lp.TargetLanguageId == learningPath.TargetLanguageId
                                                && lp.KnownLanguageId == learningPath.KnownLanguageId),
                    up => up.LearningPathId,
                    lp => lp.LearningPathId,
                    (up, lp) => up).ToListAsync();

                if (otherMarkedProgresses != null && otherMarkedProgresses.Count > 0)
                {
                    foreach (var pr in otherMarkedProgresses)
                    {
                        pr.practiseMistakesInThisPath = false;
                    }
                    await db.SaveChangesAsync();
                }
            }
        }


        if (modified)
        {
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
        bool isAdmin = claim.IsInRole("Admin");
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
                isAdmin || e.UserId == userId ? (byte)UserAccessEnum.CanEdit : (byte)UserAccessEnum.Learner
            , null))
            .ToListAsync();

        return Results.Ok(exercises);
    }

    [Authorize]
    private static async Task<IResult> AddMistake(AddMistakeDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();

        //get the exercise learnging path
        var exercise = await db.Exercises
            .Include(e => e.LearningPath)
            .FirstOrDefaultAsync(e => e.ExerciseId == dto.ExerciseId);

        if (exercise == null)
        {
            return Results.NotFound();
        }

        if (exercise.LearningPath == null)
        {
            return Results.InternalServerError("Exercise has no learning path");
        }

        //check if we have a user progress record, with mistakeAdd flag on, 
        // for these langauges and user
        var learningPathForMistakes = await db.UserProgresses.Where(p => p.UserId == userId && p.practiseMistakesInThisPath == true)
            .Join(db.LearningPaths.Where((lp) => lp.TargetLanguageId == exercise.LearningPath.TargetLanguageId && lp.KnownLanguageId == exercise.LearningPath.KnownLanguageId),
            (up) => up.LearningPathId,
            (lp) => lp.LearningPathId,
            (up, lp) => lp)
            .FirstOrDefaultAsync();

        //no learning path for mistakes found
        if (learningPathForMistakes == null)
        {
            return Results.NoContent();
        }

        //get last added exercise data
        var lastExercise = await db.Exercises
            .Where(e => e.LearningPathId == learningPathForMistakes.LearningPathId)
            .OrderByDescending(e => e.ExerciseId)
            .FirstOrDefaultAsync();

        //only add mistake if not added already lastly
        if (lastExercise == null || (lastExercise.ExerciseId != dto.ExerciseId
        && (lastExercise.ExerciseTypeId != exercise.ExerciseTypeId
            || lastExercise.Data != exercise.Data
            )))
        {

            var exerciseToAdd = new Exercise
            {
                TargetLanguageId = exercise.TargetLanguageId,
                KnownLanguageId = exercise.KnownLanguageId,
                LearningPathId = learningPathForMistakes.LearningPathId,
                ExerciseTypeId = exercise.ExerciseTypeId,
                Data = exercise.Data,
                UserId = userId,
                SourceExerciseId = exercise.SourceExerciseId ?? exercise.ExerciseId
            };

            db.Exercises.Add(exerciseToAdd);
            await db.SaveChangesAsync();

            return Results.Created($"/api/learning/exercise/{exerciseToAdd.ExerciseId}", new CreateExerciseResponseDto(exerciseToAdd.ExerciseId));
        }

        return Results.NoContent();
    }

}
