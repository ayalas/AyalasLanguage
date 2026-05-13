using System;

namespace AyalasLanguageAPI.Endpoints;

using System.Security.Claims;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Model;
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
        creator.MapDelete("/learning-path/{id}", DeleteLearningPath);
        // Exercise Creation
        creator.MapPost("/exercise", CreateExercise);
        creator.MapPut("/exercise/{id}", EditExercise); // Allow PUT for idempotent updates
        creator.MapDelete("/exercise/{id}", DeleteExercise);

    }

    [Authorize(Roles = "Admin,ContentCreator")]
    private static async Task<IResult> CreateLearningPath(CreateLearningPathDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();

        LearningPath? prevPath = null;
        LearningPath? nextPath = null;
        int prevPathId = 0;
        int nextPathId = 0;
        if (dto.PrevLearningPathId != null)
        {
            prevPath = await db.LearningPaths.FindAsync(dto.PrevLearningPathId);
            if (prevPath == null) return Results.BadRequest("Previous learning path not found.");
            prevPathId = prevPath.LearningPathId;
            

            prevPath.NextLearningPathId = null; // Unlink from any existing next path
        }
        else
        {
            // If no previous path is specified, find the last path in the sequence for this language
            prevPath = await db.LearningPaths
                .Where(lp => lp.LanguageId == dto.LanguageId && lp.NextLearningPathId == null)
                .OrderByDescending(lp => lp.Level)
                .ThenByDescending(lp => lp.Chapter)
                .FirstOrDefaultAsync();
        }

        if (dto.NextLearningPathId != null)
        {
            nextPath = await db.LearningPaths.FindAsync(dto.NextLearningPathId);
            if (nextPath == null) return Results.BadRequest("Next learning path not found.");
            nextPathId = nextPath.LearningPathId;
            //do not allow having more than one next path

            nextPath.PrevLearningPathId = null; // Unlink from any existing previous path
        }
        
        //is there another item linked to the same next or previous path?
        //we can only allow this if our prev is linked to our next and vice verse - that we can fix
        if (await db.LearningPaths.AnyAsync(lp => lp.NextLearningPathId == dto.NextLearningPathId 
            && lp.LearningPathId != prevPathId))
        {
            return Results.BadRequest("Next learning path already has a previous path.");
        }

        if (await db.LearningPaths.AnyAsync(lp => lp.PrevLearningPathId == dto.PrevLearningPathId
            && lp.LearningPathId != nextPathId))
        {
            return Results.BadRequest("Previous learning path already has a next path.");
        }

        var path = new LearningPath
        {
            LanguageId = dto.LanguageId,
            Level = dto.Level,
            Chapter = dto.Chapter,
            Name = dto.Name,
            PrevLearningPathId = dto.PrevLearningPathId,
            NextLearningPathId = dto.NextLearningPathId,
            Status = 1, // Default to active/published
            UserId = userId
        };

        db.LearningPaths.Add(path);
        await db.SaveChangesAsync();
        prevPath?.NextLearningPathId = path.LearningPathId;
        nextPath?.PrevLearningPathId = path.LearningPathId;
        await db.SaveChangesAsync();

        return Results.Created($"/api/learning/path/{path.LearningPathId}", new CreateLearningPathResponseDto(path.LearningPathId));
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

        //no need to unlink first, we can just update the links after deletion
        //prevPath?.NextLearningPathId = null;
        //nextPath?.PrevLearningPathId = null;

        db.LearningPaths.Remove(path);
        await db.SaveChangesAsync();
        prevPath?.NextLearningPathId = path.NextLearningPathId;
        nextPath?.PrevLearningPathId = path.PrevLearningPathId;
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    [Authorize(Roles = "Admin,ContentCreator")]
    private static async Task<IResult> CreateExercise( CreateExerciseDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();

        var learningPath = await db.LearningPaths.FirstOrDefaultAsync(lp => lp.LearningPathId == dto.LearningPathId);
        if (learningPath == null) return Results.BadRequest("Learning path not found.");

        var exercise = new Exercise
        {
            LanguageId = learningPath.LanguageId,
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
    private static async Task<IResult> EditExercise(int id, EditExerciseDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var exercise = await db.Exercises.FindAsync(id);
        if (exercise == null) return Results.NotFound();

        if (exercise.UserId != claim.GetUserId() && !claim.IsInRole("Admin"))
            return Results.Forbid();

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
}
