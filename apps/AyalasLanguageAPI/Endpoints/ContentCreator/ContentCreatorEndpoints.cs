using System;

namespace AyalasLanguageAPI.Endpoints;

using System.Security.Claims;
using System.Text.RegularExpressions;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Data.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using AyalasLanguageAPI.Logic;
using AyalasLanguageAPI.Utils;
using Microsoft.Extensions.Caching.Memory;

public static class ContentCreatorEndpoints
{
    public static void MapContentCreatorEndpoints(this IEndpointRouteBuilder app)
    {
        var creator = app.MapGroup("/api/creator")
            .AddEndpointFilter<ErrorLoggingFilter>()
            .WithTags("Content Creator").RequireAuthorization(new AuthorizeAttribute
        {
            AuthenticationSchemes = "PublicAuth",
            Roles = "Admin,ContentCreator"
        });

        // Learning Path Creation
        creator.MapPost("/learning-path", CreateLearningPath);
        creator.MapPut("/learning-path/{id}", EditLearningPath); // Allow PUT for idempotent updates
        creator.MapPost("/learning-path/{id}/import", ImportExercises).DisableAntiforgery();
        creator.MapDelete("/learning-path/{id}", DeleteLearningPath);
        creator.MapPost("/next-chapter", NextChapter);
        // Exercise Creation
        creator.MapGet("/exercise/{id}", GetExercise);
        creator.MapPost("/exercise", CreateExercise);
        creator.MapPut("/exercise/{id}", EditExercise); // Allow PUT for idempotent updates
        creator.MapDelete("/exercise/{id}", DeleteExercise);
        creator.MapPost("/log", CreateLog);

    }

    private static async Task<IResult> NextChapter(NextChapterDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var userId = claim.GetUserId();

        var user = await db.Users.FindAsync(userId);
        if (user == null) return Results.BadRequest("User not found.");

        if (user.KnownLanguageId == null || user.TargetLanguageId == null)
            return Results.BadRequest("User must have known and target languages set.");

        decimal chapterFrom = dto.ChapterHint - 1;
        if (chapterFrom < 0) chapterFrom = 0;
        decimal chapterTo = dto.ChapterHint + 1;

        var paths = await db.LearningPaths.Where(lp => lp.TargetLanguageId == user.TargetLanguageId &&
            lp.KnownLanguageId == user.KnownLanguageId
            && lp.Level == dto.Level
            && lp.Chapter >= chapterFrom && lp.Chapter <= chapterTo).Select(lp => new NextChapterResponseDto(lp.Chapter)).ToArrayAsync();

        decimal hint = dto.ChapterHint;

        if (paths != null && paths.Length > 0)
        {
            if (dto.ChapterHint == 0 || paths.Any(p => p.Chapter == dto.ChapterHint))
            {
                NextChapterResponseDto[] sortedArray = [.. paths.OrderBy(p => p.Chapter)];
                if (dto.ChapterHint == 0)
                {
                    hint = sortedArray[0].Chapter;
                }
                decimal nextPath = ContentCreatorLogic.FindPath(sortedArray, hint, dto.ChapterHint != 0, logger);
                logger.LogInformation("NextChapter (1.1.1.1): parameters: ChapterHint:{ChapterHint}, Level:{Level}. Process: hint:{hint}, sortedArrayLength:{sortedArrayLength}. Result:{nextChapter} ", 
                    dto.ChapterHint, dto.Level, hint,sortedArray.Length,nextPath );
                //if the desired chapter exists we need to find the closest to it
                return Results.Ok(new NextChapterResponseDto(nextPath));
            }
        }

        //if the hint is zero and we did not find 1 - return 1
        if (hint == 0)
            return Results.Ok(new NextChapterResponseDto(1));

        return Results.Ok(new NextChapterResponseDto(hint));
    }

    private static async Task<IResult> CreateLearningPath(CreateLearningPathDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var userId = claim.GetUserId();

        var user = await db.Users.FindAsync(userId);
        if (user == null) return Results.BadRequest("User not found.");

        if (user.KnownLanguageId == null || user.TargetLanguageId == null)
            return Results.BadRequest("User must have known and target languages set.");

        if (dto.Chapter <= 0)
        {
            return Results.BadRequest("Level must be a positive number.");
        }

        if (await ContentCreatorLogic.IsOtherLearningPathFoundWith(user.TargetLanguageId.Value, user.KnownLanguageId.Value, dto.Level, dto.Chapter, null, db))
        {
            return Results.BadRequest("Another lesson already exists with with these level and chapter values.");
        }

        LearningPath? prevPath = null;
        LearningPath? nextPath = null;
        int? prevPathNextId = 0;
        int? nextPathPrevId = 0;
        int prevPathId = 0;
        int nextPathId = 0;
        if (dto.PrevLearningPathId != null)
        {
            prevPath = await db.LearningPaths.FindAsync(dto.PrevLearningPathId);
            if (prevPath == null) return Results.BadRequest("Previous learning path not found.");
            prevPathId = prevPath.LearningPathId;

            prevPathNextId = prevPath.NextLearningPathId; //save the id
            prevPath.NextLearningPathId = null; // Unlink from any existing next path
        }
        else if (dto.NextLearningPathId == null)
        {
            // If no previous path and no next path is specified, find the last path in the sequence for this language learning
            prevPath = (await db.LearningPaths
                .Where(lp => lp.TargetLanguageId == user.TargetLanguageId
                    && lp.KnownLanguageId == user.KnownLanguageId && lp.NextLearningPathId == null)
                .OrderByDescending(lp => lp.Level)
                .ToListAsync()).OrderByDescending(lp => lp.Chapter).FirstOrDefault();
            if (prevPath != null)
            {
                prevPathId = prevPath.LearningPathId;
                prevPathNextId = prevPath.NextLearningPathId; //save the id
            }
        }

        if (dto.NextLearningPathId != null)
        {
            nextPath = await db.LearningPaths.FindAsync(dto.NextLearningPathId);
            if (nextPath == null) return Results.BadRequest("Next learning path not found.");
            nextPathId = nextPath.LearningPathId;
            //do not allow having more than one next path
            nextPathPrevId = nextPath.PrevLearningPathId;
            nextPath.PrevLearningPathId = null; // Unlink from any existing previous path


            //is there another item linked to the same next or previous path?
            //we can only allow this if our prev is linked to our next and vice verse - that we can fix
            if (prevPathId != 0)
            {
                if (await db.LearningPaths.AnyAsync(lp => lp.NextLearningPathId == dto.NextLearningPathId
                    && lp.LearningPathId != prevPathId))
                {
                    logger.LogWarning("Next learning path {NextPathId} already has a previous path linked that is not the current previous path {PrevPathId}.", dto.NextLearningPathId, prevPathId);
                    return Results.BadRequest("Next learning path already has a previous path.");
                }
            }
        }

        int? nextToUpdate = dto.NextLearningPathId;

        if (nextPathId == 0 && prevPathNextId != null && prevPathNextId > 0)
        {
            nextToUpdate = prevPathNextId;
            nextPath = await db.LearningPaths.FindAsync(nextToUpdate);
            if (nextPath == null) return Results.BadRequest($"Next learning path not found [prev path next path: {prevPathNextId}].");
            nextPath.PrevLearningPathId = null; // Unlink from any existing previous path
        }

        if (dto.PrevLearningPathId != null && await db.LearningPaths.AnyAsync(lp => lp.PrevLearningPathId == dto.PrevLearningPathId
            && lp.LearningPathId != nextToUpdate))
        {
            logger.LogWarning("Previous learning path {PrevPathId} already has a next path linked that is not the current next path {NextPathId}.", dto.PrevLearningPathId, nextToUpdate);
            return Results.BadRequest("Previous learning path already has a next path.");
        }

        var path = new LearningPath
        {
            TargetLanguageId = user.TargetLanguageId.Value,
            KnownLanguageId = user.KnownLanguageId.Value,
            Level = dto.Level,
            Chapter = dto.Chapter,
            Name = dto.Name,
            PrevLearningPathId = dto.PrevLearningPathId,
            NextLearningPathId = nextToUpdate,
            Status = (int)ContentStatusEnum.Draft, // Default to draft
            UserId = userId
        };

        db.LearningPaths.Add(path);
        await db.SaveChangesAsync();
        if (prevPath != null)
        {
            prevPath.NextLearningPathId = path.LearningPathId;
        }
        if (nextPath != null)
        {
            nextPath.PrevLearningPathId = path.LearningPathId;
        }
        await db.SaveChangesAsync();

        return Results.Created($"/api/learning/path/{path.LearningPathId}", new CreateLearningPathResponseDto(path.LearningPathId));
    }

    private static async Task<IResult> ImportExercises(int id, IFormFile file, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var userId = claim.GetUserId();

        var learningPath = await db.LearningPaths.FirstOrDefaultAsync(lp => lp.LearningPathId == id);
        if (learningPath == null) return Results.BadRequest("Learning path not found.");

        string? fileContent = null;
        using (var stream = file.OpenReadStream())
        using (var reader = new StreamReader(stream))
        {
            // 2. Read the entire content into a string variable
            fileContent = await reader.ReadToEndAsync();
        }

        List<ExerciseDto>? dtoList = System.Text.Json.JsonSerializer.Deserialize<List<ExerciseDto>>(fileContent, new System.Text.Json.JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
        if (dtoList == null)
        {
            return Results.BadRequest("Could not parse exercises.");
        }
        foreach (ExerciseDto dto in dtoList)
        {
            if (!ContentCreatorLogic.ValidateExerciseData(dto.ExerciseTypeId, dto.Data, logger))
                return Results.BadRequest($"Invalid exercise data format for the specified exercise type. Type:{((ExerciseTypesEnum)dto.ExerciseTypeId).ToString()}. Data: {dto.Data}");

            var exercise = new Exercise
            {
                TargetLanguageId = learningPath.TargetLanguageId,
                KnownLanguageId = learningPath.KnownLanguageId,
                LearningPathId = id,
                ExerciseTypeId = dto.ExerciseTypeId,
                Data = dto.Data,
                UserId = userId
            };

            db.Exercises.Add(exercise);
        }

        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> EditLearningPath(int id, EditLearningPathDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var path = await db.LearningPaths.FindAsync(id);
        if (path == null) return Results.NotFound();

        if ((path.UserId != claim.GetUserId() || path.Status == (byte)ContentStatusEnum.Removed) && !claim.IsInRole("Admin"))
            return Results.Forbid();

        

        if (dto.Chapter <= 0)
        {
            return Results.BadRequest("Chapter must be a positive number.");
        }

        if (await ContentCreatorLogic.IsOtherLearningPathFoundWith(path.TargetLanguageId, path.KnownLanguageId, dto.Level, dto.Chapter, path.LearningPathId, db))
        {
            return Results.BadRequest("Another lesson already exists with with these level and chapter values.");
        }

        path.Level = dto.Level;
        path.Chapter = dto.Chapter;
        path.Name = dto.Name;
        path.Status = (byte)ContentStatusEnum.Draft;

        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> DeleteLearningPath(int id, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var path = await db.LearningPaths.FindAsync(id);
        if (path == null) return Results.NotFound();

        if ((path.UserId != claim.GetUserId() || path.Status == (byte)ContentStatusEnum.Removed) && !claim.IsInRole("Admin"))
            return Results.Forbid();

        if (db.UserProgresses.Any(up => up.LearningPathId == id))
            return Results.BadRequest("Learning path in use.");

        if (db.Exercises.Any(up => up.LearningPathId == id))
            return Results.BadRequest("Learning path has exercises.");

        //deal with linking
        var prevPath = await db.LearningPaths.FirstOrDefaultAsync(lp => lp.NextLearningPathId == id);
        var nextPath = await db.LearningPaths.FirstOrDefaultAsync(lp => lp.PrevLearningPathId == id);


        db.LearningPaths.Remove(path);
        await db.SaveChangesAsync();
        if (prevPath != null)
        {
            prevPath.NextLearningPathId = path.NextLearningPathId;
        }
        if (nextPath != null)
        {
            nextPath.PrevLearningPathId = path.PrevLearningPathId;
        }

        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> CreateExercise(CreateExerciseDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var userId = claim.GetUserId();
        var learningPath = await db.LearningPaths.FirstOrDefaultAsync(lp => lp.LearningPathId == dto.LearningPathId);
        if (learningPath == null) return Results.BadRequest("Learning path not found.");

        if (!ContentCreatorLogic.ValidateExerciseData(dto.ExerciseTypeId, dto.Data, logger))
            return Results.BadRequest("Invalid exercise data format for the specified exercise type.");

        var exercise = new Exercise
        {
            TargetLanguageId = learningPath.TargetLanguageId,
            KnownLanguageId = learningPath.KnownLanguageId,
            LearningPathId = dto.LearningPathId,
            ExerciseTypeId = dto.ExerciseTypeId,
            Data = dto.Data,
            UserId = userId
        };

        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();

        return Results.Created($"/api/learning/exercise/{exercise.ExerciseId}", new CreateExerciseResponseDto(exercise.ExerciseId));
    }

    private static async Task<IResult> GetExercise(int id, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var exercise = await db.Exercises
        .FirstOrDefaultAsync(e => e.ExerciseId == id);
        if (exercise == null) return Results.NotFound();

        if ((exercise.UserId != claim.GetUserId() || exercise.Status == (byte)ContentStatusEnum.Removed) && !claim.IsInRole("Admin"))
            return Results.Forbid();

        return Results.Ok(new ExerciseDto(exercise.ExerciseId, exercise.ExerciseTypeId, exercise.Data, (byte)UserAccessEnum.CanEdit, exercise.LearningPathId));
    }

    private static async Task<IResult> EditExercise(int id, EditExerciseDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var exercise = await db.Exercises
        .Include(e => e.ChildExercises)
        .Include(e => e.SourceExercise)
        .FirstOrDefaultAsync(e => e.ExerciseId == id);
        if (exercise == null) return Results.NotFound();

        if ((exercise.UserId != claim.GetUserId() || exercise.Status == (byte)ContentStatusEnum.Removed) && !claim.IsInRole("Admin"))
            return Results.Forbid();

        if (!ContentCreatorLogic.ValidateExerciseData(exercise.ExerciseTypeId, dto.Data, logger))
            return Results.BadRequest("Invalid exercise data format for the specified exercise type.");

        //see if Alternatives changed and we have a source exercise id
        if (((ExerciseTypesEnum)exercise.ExerciseTypeId).SupportsAlternativeAnswers())
        {
            // get added alternatives
            List<string> addedAlternatives = [];
            List<string> removedAlternatives = [];
            var dtoSimpleNew = System.Text.Json.JsonSerializer.Deserialize<Dtos.ExerciseDtos.SimpleTranslateDto>(dto.Data);
            var dtoSimpleOld = System.Text.Json.JsonSerializer.Deserialize<Dtos.ExerciseDtos.SimpleTranslateDto>(exercise.Data);

            if (dtoSimpleNew != null)
            {
                if (dtoSimpleOld == null || dtoSimpleOld.Alternatives == null || dtoSimpleOld.Alternatives.Length == 0)
                {
                    if (dtoSimpleNew.Alternatives != null && dtoSimpleNew.Alternatives.Length > 0)
                        addedAlternatives.AddRange(dtoSimpleNew.Alternatives);
                }
                else
                {
                    if (dtoSimpleNew.Alternatives != null && dtoSimpleNew.Alternatives.Length > 0)
                    {
                        foreach (string alternative in dtoSimpleNew.Alternatives)
                        {
                            if (!dtoSimpleOld.Alternatives.Contains(alternative))
                                addedAlternatives.Add(alternative);
                        }

                        foreach (string alternative in dtoSimpleOld.Alternatives)
                        {
                            if (!dtoSimpleNew.Alternatives.Contains(alternative))
                                removedAlternatives.Add(alternative);
                        }
                    }
                    else
                    {
                        removedAlternatives.AddRange(dtoSimpleOld.Alternatives);
                    }
                }
            }

            //we have added alternatives - get source exercise id + all other exercises sourcing to it
            //and update alternatives for them too
            if (addedAlternatives.Count > 0 || removedAlternatives.Count > 0)
            {
                string[] addedAlternativesArr = [.. addedAlternatives];
                string[] removedAlternativesArr = [.. removedAlternatives];
                //update the source
                if (exercise.SourceExercise != null)
                {
                    ContentCreatorLogic.AddAlternativesToExercise(exercise.SourceExercise, addedAlternativesArr, removedAlternativesArr);
                    //get the source children that are not this exercise
                    var sourceChildren = await db.Exercises
                    .Where(e => e.ExerciseId == exercise.SourceExerciseId
                        && e.ExerciseId != id)
                        .ToListAsync();
                    //update the source children that are not this exercise
                    if (sourceChildren != null && sourceChildren.Count > 0)
                    {
                        foreach (Exercise ex in sourceChildren)
                        {
                            ContentCreatorLogic.AddAlternativesToExercise(ex, addedAlternativesArr, removedAlternativesArr);
                        }
                    }
                }
                //update this exercise children
                if (exercise.ChildExercises != null && exercise.ChildExercises.Count > 0)
                {
                    foreach (Exercise ex in exercise.ChildExercises)
                    {
                        ContentCreatorLogic.AddAlternativesToExercise(ex, addedAlternativesArr, removedAlternativesArr);
                    }
                }
            }
        }

        exercise.Data = dto.Data;
        exercise.Status = (byte)ContentStatusEnum.Draft;

        await db.SaveChangesAsync();

        return Results.Ok();
    }

    private static async Task<IResult> DeleteExercise(int id, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var exercise = await db.Exercises.FindAsync(id);
        if (exercise == null) return Results.NotFound();

        if ((exercise.UserId != claim.GetUserId() || exercise.Status == (byte)ContentStatusEnum.Removed) && !claim.IsInRole("Admin"))
            return Results.Forbid();

        db.Exercises.Remove(exercise);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> CreateLog(CreateLogRequestDto dto, ClaimsPrincipal claim, IMemoryCache cache, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();

        if (!CacheUtils.ProtectByCacheCount(Constants.LOG_COUNT_CACHE_KEY, cache, Constants.MAX_LOG_PER_PERIOD))
        {
            return Results.Conflict("The system cannot accept any more logs at this time");
        }

        Log rec = new()
        {
            UserId = userId,
            LogType = (int)dto.LogType,
            Description = dto.Description
        };
        db.Logs.Add(rec);
        await db.SaveChangesAsync();

        CacheUtils.AddToCountProtection(Constants.LOG_COUNT_CACHE_KEY, cache, Constants.CACHE_PROTECTION_MINUTES);

        return Results.Ok();
    }


}
