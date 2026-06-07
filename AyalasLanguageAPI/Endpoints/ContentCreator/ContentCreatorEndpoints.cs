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

public static class ContentCreatorEndpoints
{
    public static void MapContentCreatorEndpoints(this IEndpointRouteBuilder app)
    {
        var creator = app.MapGroup("/api/creator").WithTags("Content Creator");

        // Learning Path Creation
        creator.MapPost("/learning-path", CreateLearningPath);
        creator.MapPut("/learning-path/{id}", EditLearningPath); // Allow PUT for idempotent updates
        creator.MapPost("/learning-path/{id}/import", ImportExercises).DisableAntiforgery();
        creator.MapDelete("/learning-path/{id}", DeleteLearningPath);
        // Exercise Creation
        creator.MapPost("/exercise", CreateExercise);
        creator.MapPut("/exercise/{id}", EditExercise); // Allow PUT for idempotent updates
        creator.MapDelete("/exercise/{id}", DeleteExercise);

    }

    [Authorize(Roles = "Admin,ContentCreator")]
    private static async Task<IResult> CreateLearningPath(CreateLearningPathDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var userId = claim.GetUserId();

        var user = await db.Users.FindAsync(userId);
        if (user == null) return Results.BadRequest("User not found.");

        if (user.KnownLanguageId == null || user.TargetLanguageId == null)
            return Results.BadRequest("User must have known and target languages set.");

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
            prevPath = await db.LearningPaths
                .Where(lp => lp.TargetLanguageId == user.TargetLanguageId
                    && lp.KnownLanguageId == user.KnownLanguageId && lp.NextLearningPathId == null)
                .OrderByDescending(lp => lp.Level)
                .ThenByDescending(lp => lp.Chapter)
                .FirstOrDefaultAsync();
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
            Status = 1, // Default to active/published
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
    [Authorize(Roles = "Admin,ContentCreator")]
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
            if (!ValidateExerciseData(dto.ExerciseTypeId, dto.Data, logger))
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

    [Authorize(Roles = "Admin,ContentCreator")]
    private static async Task<IResult> EditLearningPath(int id, EditLearningPathDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var path = await db.LearningPaths.FindAsync(id);
        if (path == null) return Results.NotFound();

        if (path.UserId != claim.GetUserId() && !claim.IsInRole("Admin"))
            return Results.Forbid();

        path.Level = dto.Level;
        path.Chapter = dto.Chapter;
        path.Name = dto.Name;

        await db.SaveChangesAsync();
        return Results.Ok();
    }

    [Authorize(Roles = "Admin,ContentCreator")]
    private static async Task<IResult> DeleteLearningPath(int id, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var path = await db.LearningPaths.FindAsync(id);
        if (path == null) return Results.NotFound();

        if (path.UserId != claim.GetUserId() && !claim.IsInRole("Admin"))
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

    [Authorize(Roles = "Admin,ContentCreator")]
    private static async Task<IResult> CreateExercise(CreateExerciseDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var userId = claim.GetUserId();
        var learningPath = await db.LearningPaths.FirstOrDefaultAsync(lp => lp.LearningPathId == dto.LearningPathId);
        if (learningPath == null) return Results.BadRequest("Learning path not found.");

        if (!ValidateExerciseData(dto.ExerciseTypeId, dto.Data, logger))
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

    [Authorize(Roles = "Admin,ContentCreator")]
    private static async Task<IResult> EditExercise(int id, EditExerciseDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var exercise = await db.Exercises
        .Include(e => e.ChildExercises)
        .Include(e => e.SourceExercise)
        .FirstOrDefaultAsync(e => e.ExerciseId == id);
        if (exercise == null) return Results.NotFound();

        if (exercise.UserId != claim.GetUserId() && !claim.IsInRole("Admin"))
            return Results.Forbid();

        if (!ValidateExerciseData(exercise.ExerciseTypeId, dto.Data, logger))
            return Results.BadRequest("Invalid exercise data format for the specified exercise type.");

        //see if Alternatives changed and we have a source exercise id
        if (exercise.SourceExerciseId != null && (exercise.ExerciseTypeId == (int)ExerciseTypesEnum.FromKnownToTarget
            || exercise.ExerciseTypeId == (int)ExerciseTypesEnum.FromTargetToKnown))
        {
            // get added alternatives
            List<string> addedAlternatives = [];
            var dtoSimpleNew = System.Text.Json.JsonSerializer.Deserialize<Dtos.ExerciseDtos.SimpleTranslateDto>(dto.Data);
            var dtoSimpleOld = System.Text.Json.JsonSerializer.Deserialize<Dtos.ExerciseDtos.SimpleTranslateDto>(exercise.Data);
            if (dtoSimpleNew != null && dtoSimpleNew.Alternatives != null && dtoSimpleNew.Alternatives.Length > 0)
            {
                if (dtoSimpleOld == null || dtoSimpleOld.Alternatives == null || dtoSimpleOld.Alternatives.Length == 0)
                {
                    addedAlternatives.AddRange(dtoSimpleNew.Alternatives);
                }
                else
                {
                    foreach (string alternative in dtoSimpleNew.Alternatives)
                    {
                        if (!dtoSimpleOld.Alternatives.Contains(alternative))
                            addedAlternatives.Add(alternative);
                    }
                }
            }

            //we have added alternatives - get source exercise id + all other exercises sourcing to it
            //and update alternatives for them too
            if (addedAlternatives.Count > 0)
            {
                string[] addedAlternativesArr = [.. addedAlternatives];
                //update the source
                if (exercise.SourceExercise != null)
                {
                    AddAlternativesToExercise(exercise.SourceExercise, addedAlternativesArr);
                    //get the source children that are not this exercise
                    var sourceChildren = await db.Exercises
                    .Where(e => e.ExerciseId == exercise.SourceExerciseId
                        && e.ExerciseId != id)
                        .ToListAsync();
                    //update the source children that are not this exercise
                    if (sourceChildren != null && sourceChildren.Count > 0)
                    {
                        foreach(Exercise ex in sourceChildren)
                        {
                            AddAlternativesToExercise(ex, addedAlternativesArr);
                        }
                    }
                }
                //update this exercise children
                if (exercise.ChildExercises != null && exercise.ChildExercises.Count > 0)
                {
                    foreach(Exercise ex in exercise.ChildExercises)
                    {
                        AddAlternativesToExercise(ex, addedAlternativesArr);
                    }
                }
            }
        }

        exercise.Data = dto.Data;

        await db.SaveChangesAsync();

        return Results.Ok();
    }

    [Authorize(Roles = "Admin,ContentCreator")]
    private static async Task<IResult> DeleteExercise(int id, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var exercise = await db.Exercises.FindAsync(id);
        if (exercise == null) return Results.NotFound();

        if (exercise.UserId != claim.GetUserId() && !claim.IsInRole("Admin"))
            return Results.Forbid();

        db.Exercises.Remove(exercise);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static void AddAlternativesToExercise(Exercise targetExercise, string[] addedAlternativesArr)
    {
        var dtoSimple2 = System.Text.Json.JsonSerializer.Deserialize<Dtos.ExerciseDtos.SimpleTranslateDto>(targetExercise.Data);
        if (dtoSimple2 != null)
        {
            bool needUpdate = false;
            if (dtoSimple2.Alternatives == null || dtoSimple2.Alternatives.Length == 0)
            {
                dtoSimple2.Alternatives = addedAlternativesArr;
                needUpdate = true;
            }
            else
            {
                List<string> toAdd = [];
                foreach (string alternative in addedAlternativesArr)
                {
                    if (!dtoSimple2.Alternatives.Contains(alternative))
                        toAdd.Add(alternative);
                }
                needUpdate = (toAdd.Count > 0);
                if (needUpdate)
                {
                    dtoSimple2.Alternatives = [.. dtoSimple2.Alternatives, .. toAdd];
                }
            }
            if (needUpdate)
            {
                targetExercise.Data = System.Text.Json.JsonSerializer.Serialize(dtoSimple2);
            }
        }
    }

    /// <summary>
    /// Simple yes/no validation - the client should ensure the data is correct before sending,
    /// but we want to have some basic validation on the server to prevent malformed data 
    /// from being saved.
    /// </summary>
    /// <param name="exerciseTypeId"></param>
    /// <param name="data"></param>
    /// <returns></returns>
    private static bool ValidateExerciseData(int exerciseTypeId, string data, ILogger<Program> logger)
    {
        if (string.IsNullOrEmpty(data))
            return false;

        try
        {
            switch (exerciseTypeId)
            {
                case (int)ExerciseTypesEnum.FromKnownToTarget:
                case (int)ExerciseTypesEnum.FromTargetToKnown:
                case (int)ExerciseTypesEnum.FillInTheBlanks:
                case (int)ExerciseTypesEnum.Matching:
                    // Validate that data is a JSON array of options
                    var dtoSimple = System.Text.Json.JsonSerializer.Deserialize<Dtos.ExerciseDtos.SimpleTranslateDto>(data);
                    return dtoSimple != null && !string.IsNullOrEmpty(dtoSimple.First) && !string.IsNullOrEmpty(dtoSimple.Second);
                case (int)ExerciseTypesEnum.FromKnownToTargetBucket:
                    // Validate that data is a JSON object with question, options, and correct answer
                    var dtoBucket = System.Text.Json.JsonSerializer.Deserialize<Dtos.ExerciseDtos.BucketTranslateDto>(data);
                    if (!(dtoBucket != null
                           && !string.IsNullOrEmpty(dtoBucket.First)
                           && !string.IsNullOrEmpty(dtoBucket.Second)
                           && dtoBucket.ExtraOptions.Split(" ").Length >= Constants.BUCKET_EXTRA_MIN_COUNT
                           && dtoBucket.ExtraOptions.Split(" ").Length <= Constants.BUCKET_EXTRA_MAX_COUNT))
                    {
                        logger.LogWarning("Bucket exercise data validation failed. Data: {Data}", data);
                        return false;
                    }
                    else
                    {
                        return true;
                    }
                default:
                    return false; // Assuming invalid for unknown types
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error validating exercise data for exercise type {ExerciseTypeId}. Data: {Data}", exerciseTypeId, data);
            return false; // If any exception occurs during validation, consider it invalid
        }
    }
}
