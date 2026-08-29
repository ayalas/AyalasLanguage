using System;
using System.Security.Claims;
using System.Xml;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Data.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using AyalasLanguageJobs;

namespace AyalasLanguageAPI.Endpoints.Learning;

public static class LearningEndpoints
{
    public static void MapLearningEndpoints(this IEndpointRouteBuilder app, string prefix)
    {
        var learning = app.MapGroup($"{prefix}/learning").WithTags("Learning")
            .AddEndpointFilter<ErrorLoggingFilter>()
            .RequireAuthorization(new AuthorizeAttribute
            {
                AuthenticationSchemes = "PublicAuth"
            });

        learning.MapGet("/path", GetLearningPath);
        learning.MapGet("/path/{pathId:int}", GetSingleLearningPath);
        learning.MapGet("/path/{pathId:int}/exercises", GetAllExercises);
        learning.MapPost("/path/{pathId:int}/paged", GetPagedExercises);
        learning.MapPost("/progress", UpdateUserProgress);
        learning.MapPost("/mistake", AddMistake);
        learning.MapDelete("/progress/{pathId:int}", DeleteUserProgress);
    }

    private static async Task<IResult> GetSingleLearningPath(int pathId, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();
        bool isAdmin = claim.IsInRole("Admin");

        var query = db.LearningPaths
            .Where(lp => lp.LearningPathId == pathId && lp.Status != (byte)ContentStatusEnum.Removed);

        if (!isAdmin)
        {
            query = query.Where(lp => lp.OwnershipType == (byte)OwnershipTypeEnum.Public || lp.UserId == userId);
        }

        return Results.Ok(await query
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
                    (OwnershipTypeEnum)x.lp.OwnershipType,
                    // EF9 cleanly translates null-coalescing and conditionals here into SQL CASE WHEN
                    up == null
                        ? (byte)UserProgressEnum.NotStarted
                        : up.ExerciseId == null
                            ? (byte)UserProgressEnum.Done
                            : (byte)UserProgressEnum.InProgress,
                    up == null ? null : up.ExerciseId,
                    // EF9 optimizes correlated subquery counts beautifully
                    db.Exercises.Count(e => e.LearningPathId == x.lp.LearningPathId && e.Status != (byte)ContentStatusEnum.Removed),
                    x.lp.UserId == userId ? (byte)UserAccessEnum.CanEdit : (byte)UserAccessEnum.Learner,
                    up != null && up.practiseMistakesInThisPath
                )
            )
            .FirstOrDefaultAsync());
    }

    private static async Task<IResult> GetLearningPath(ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var userId = claim.GetUserId();
        bool isAdmin = claim.IsInRole("Admin");

        var user = await db.Users.FindAsync(userId);
        if (user == null) return Results.NotFound();

        if (user.TargetLanguageId == null || user.KnownLanguageId == null)
        {
            return Results.BadRequest("User does not have a target language set.");
        }

        int languageId = user.TargetLanguageId.Value;

        var query = db.LearningPaths
        .Where(lp => lp.TargetLanguageId == languageId && lp.KnownLanguageId == user.KnownLanguageId.Value
        && lp.Status != (byte)ContentStatusEnum.Removed);

        //implement ShowOnlyPrivateContent: return only content the user created (a preference in profile screen)
        if (user.ShowOnlyPrivateContent)
        {
            query = query.Where(lp => lp.UserId == userId);
        }
        else if (!isAdmin)
        {
            query = query.Where(lp => lp.OwnershipType == (byte)OwnershipTypeEnum.Public || lp.UserId == userId);
        }

        var exerciseBaseQuery = db.Exercises.Where(e => e.Status != (byte)ContentStatusEnum.Removed);

        if (user.ShowOnlyPrivateContent)
        {
            // Only show items owned by the user
            exerciseBaseQuery = exerciseBaseQuery.Where(e => e.UserId == userId);
        }
        else if (!isAdmin)
        {
            // Show public items OR items owned by the user
            exerciseBaseQuery = exerciseBaseQuery.Where(e =>
                e.OwnershipType == (byte)OwnershipTypeEnum.Public || e.UserId == userId);
        }

        var learningPathsWithStatus = (await query.GroupJoin(
            db.UserProgresses.Include(up => up.Exercise).Where(up => up.UserId == userId),
            lp => lp.LearningPathId,
            up => up.LearningPathId,
            (lp, userProgressGroup) => new { lp, userProgressGroup }
        )
        .SelectMany(
            x => x.userProgressGroup.DefaultIfEmpty(),
            (x, up) => new LearningPathDto
            (
                x.lp.LearningPathId,
                x.lp.Level,
                x.lp.Chapter,
                x.lp.Name,
                (ContentStatusEnum)x.lp.Status,
                (OwnershipTypeEnum)x.lp.OwnershipType,
                up == null
                    ? (byte)UserProgressEnum.NotStarted
                    : up.ExerciseId == null
                        ? (byte)UserProgressEnum.Done
                        : (byte)UserProgressEnum.InProgress,
                exerciseBaseQuery.Count(e => e.LearningPathId == x.lp.LearningPathId),
                up != null && up.practiseMistakesInThisPath,
                up != null ? up.ModifiedOn : null,
                // --- Get ExerciseTypeId START ---
                up == null || up.ExerciseId == null
                    ? exerciseBaseQuery
                        .Where(e => e.LearningPathId == x.lp.LearningPathId)
                        .OrderBy(e => e.ExerciseId) // Or your specific sequence logic
                        .Select(e => (int?)e.ExerciseTypeId)
                        .FirstOrDefault()
                    : up.Exercise.ExerciseTypeId
            // --- Get ExerciseTypeId END ---
            )
        )
        .ToListAsync()).OrderBy(it => it.Level)
        .ThenBy(it => it.Chapter);

        return Results.Ok(learningPathsWithStatus);
    }

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
                .FirstOrDefaultAsync(exr => exr.ExerciseId == dto.exerciseId && exr.LearningPathId == dto.LearningPathId && exr.Status != (byte)ContentStatusEnum.Removed);
            if (exercise == null)
            {
                return Results.BadRequest("Exercise not found");
            }

            exerciseId = dto.exerciseId;
        }

        //validate the learning path permission once whether there is a progress record or not
        if (dto.practiseMistakesInThisPath != null && dto.practiseMistakesInThisPath.Value == true
            && await db.LearningPaths.AnyAsync(
                lp => lp.LearningPathId == dto.LearningPathId &&
                lp.UserId != userId && lp.OwnershipType == (byte)OwnershipTypeEnum.User
            ))
        {
            return Results.Conflict("Cannot set Practise My Mistakes on a private lesson not owned by you");
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
            progress.ModifiedOn = DateTime.UtcNow;
            await db.SaveChangesAsync();

            modified = true;
        }

        if (practiseMistakesInThisPath)
        {
            //get the languages for this learning path 
            var learningPath = await db.LearningPaths
                .FirstOrDefaultAsync(lp => lp.LearningPathId == dto.LearningPathId && lp.Status != (byte)ContentStatusEnum.Removed);

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

    private static async Task<IResult> DeleteUserProgress(int pathId, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();
        var progress = await db.UserProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.LearningPathId == pathId);

        if (progress == null) return Results.NoContent();

        db.UserProgresses.Remove(progress);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> GetAllExercises(int pathId, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();
        bool isAdmin = claim.IsInRole("Admin");

        var query = await GetExercisesQuery(pathId, userId, isAdmin, db);
        if (query == null)
        {
            return Results.NotFound();
        }

        //add if we want to handle approved exercises
        //&& (e.Status == (byte)ContentStatusEnum.Approved || e.UserId == userId)

        //Filter exercises by path and user exercise types
        var exercises = await GetExercisesDtoQuery(query, userId, isAdmin)
            .ToListAsync();

        return Results.Ok(exercises);
    }

    private static async Task<IResult> GetPagedExercises(int pathId, PagedExercisesRequest req, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var userId = claim.GetUserId();
        bool isAdmin = claim.IsInRole("Admin");
        var query = await GetExercisesQuery(pathId, userId, isAdmin, db);
        if (query == null)
        {
            return Results.NotFound();
        }

        int page = 0;
        int numOfRecords = 0;

        if (req.StartExerciseId != null)
        {
            //count exercises until exercise id to find the page
            var countToExerciseQuery = query.Where(ex => ex.ExerciseId <= req.StartExerciseId);
            int countToExercise = await countToExerciseQuery.CountAsync();

            if (countToExercise > 0)
            {
                page = countToExercise / Constants.PAGE_SIZE;
                if (countToExercise % Constants.PAGE_SIZE > 0)
                {
                    page++;
                }
            }
        }
        else
        {
            page = req.Page ?? 0;
        }

        //if we never got the numOfRecords or we have a refreshCount
        if (page == 0 || req.StartExerciseId != null || req.RefreshCount)
        {
            numOfRecords = await query.CountAsync();
        }

        var exercises = await GetExercisesDtoQuery(query, userId, isAdmin)
            .Skip(page * Constants.PAGE_SIZE).Take(Constants.PAGE_SIZE + 1)
            .ToArrayAsync();
        
        logger.LogInformation("PagedExercisesResponse for {page}, {numOfRecords}", page, numOfRecords);

        return Results.Ok(new PagedExercisesResponse(numOfRecords, page, exercises));
    }

    private static async Task<IQueryable<Exercise>?> GetExercisesQuery(int pathId, int userId, bool isAdmin, AyalasLanguageDbContext db)
    {
        var user = await db.Users.FindAsync(userId);
        if (user == null) return null;

        //Allow admin to get all exercises (but not create new ones on private lessons)
        var query = db.Exercises
            .Where(e => e.LearningPathId == pathId
            && e.Status != (byte)ContentStatusEnum.Removed).AsQueryable();


        if (user.ShowOnlyPrivateContent) //own content
        {
            query = query.Where(e => e.UserId == userId);
        }
        else if (!isAdmin)
        {
            query = query.Where(e => e.OwnershipType == (byte)OwnershipTypeEnum.Public || e.UserId == userId);
        }

        return query;
    }
    //GetPagedExercises

    private static IQueryable<ExerciseDto> GetExercisesDtoQuery(IQueryable<Exercise> query, int userId, bool isAdmin)
    {
        return query.OrderBy(e => e.ExerciseId) // Ensure consistent ordering
            .Select(e => new ExerciseDto(e.ExerciseId, e.ExerciseTypeId, e.Data,
                isAdmin || e.UserId == userId ? (byte)UserAccessEnum.CanEdit : (byte)UserAccessEnum.Learner
            , e.LearningPathId, (OwnershipTypeEnum)e.OwnershipType));
    }
    internal static async Task<UserProgress?> GetMistakesLearningPathForUser(int userId, int targetLanguageId, int knownLanguageId, AyalasLanguageDbContext db)
    {
        return await db.UserProgresses.Where(p => p.UserId == userId && p.practiseMistakesInThisPath == true)
            .Join(db.LearningPaths.Where((lp) => lp.TargetLanguageId == targetLanguageId && lp.KnownLanguageId == knownLanguageId
                //do not consider a private lesson to be someone else's "Mistakes" lesson (even if admin and was able to set practiseMistakesInThisPath to true by some manipulation)
                && (lp.OwnershipType == (byte)OwnershipTypeEnum.Public || lp.UserId == userId)
            ),
            (up) => up.LearningPathId,
            (lp) => lp.LearningPathId,
            (up, lp) => up)
            .FirstOrDefaultAsync();
    }

    private static async Task<IResult> AddMistake(AddMistakeDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db, IJobQueue jobQueue)
    {
        var userId = claim.GetUserId();

        //get the exercise learnging path
        var exercise = await db.Exercises
            .Include(e => e.LearningPath)
            .FirstOrDefaultAsync(e => e.ExerciseId == dto.ExerciseId
            && e.Status != (byte)ContentStatusEnum.Removed
            && e.LearningPath != null && e.LearningPath.Status != (byte)ContentStatusEnum.Removed);

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
        var userProgress = await GetMistakesLearningPathForUser(userId, exercise.LearningPath.TargetLanguageId, exercise.LearningPath.KnownLanguageId, db);

        //no learning path for mistakes found
        if (userProgress == null)
        {
            return Results.NoContent();
        }

        //get last added exercise data
        var lastExercise = await db.Exercises
            .Where(e => e.LearningPathId == userProgress.LearningPathId)
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
                LearningPathId = userProgress.LearningPathId,
                ExerciseTypeId = exercise.ExerciseTypeId,
                OwnershipType = exercise.OwnershipType,
                Data = exercise.Data,
                UserId = userId,
                SourceExerciseId = exercise.SourceExerciseId ?? exercise.ExerciseId
            };

            db.Exercises.Add(exerciseToAdd);
            await db.SaveChangesAsync();

            if (userProgress.ExerciseId == null)
            {
                userProgress.ExerciseId = exerciseToAdd.ExerciseId;
                userProgress.ModifiedOn = DateTime.UtcNow;
                await db.SaveChangesAsync();
            }

            //job for other users
            await jobQueue.EnqueueJobAsync(new JobRequest(
                JobTypeEnum.UsersProgressUpdateOnExerciseCreate,
                userProgress.LearningPathId,
                exerciseToAdd.ExerciseId,
                null
            ));

            return Results.Created($"/api/learning/exercise/{exerciseToAdd.ExerciseId}", new CreateExerciseResponseDto(exerciseToAdd.ExerciseId));
        }

        return Results.NoContent();
    }

}
