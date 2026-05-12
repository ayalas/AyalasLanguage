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
        
        // Exercise Creation
        creator.MapPost("/exercise", CreateExercise);

        // Utility to link two existing paths
        creator.MapPatch("/learning-path/link", LinkPaths);
    }

    [Authorize(Roles = "Admin,ContentCreator")]
    private static async Task<IResult> CreateLearningPath(ClaimsPrincipal claim, LearningPathCreateDto dto, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();
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

        return Results.Created($"/api/learning/path/{path.LearningPathId}", path);
    }

    [Authorize(Roles = "Admin,ContentCreator")]
    private static async Task<IResult> CreateExercise(ClaimsPrincipal claim, ExerciseCreateDto dto, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();
        var exercise = new Exercise
        {
            LanguageId = dto.LanguageId,
            LearningPathId = dto.LearningPathId,
            ExerciseTypeId = dto.ExerciseTypeId,
            Data = dto.Data,
            UserId = userId
        };

        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();

        return Results.Created($"/api/learning/exercise/{exercise.ExerciseId}", exercise);
    }

    [Authorize(Roles = "Admin,ContentCreator")]
    private static async Task<IResult> LinkPaths(int prevId, int nextId, AyalasLanguageDbContext db)
    {
        var prevPath = await db.LearningPaths.FindAsync(prevId);
        var nextPath = await db.LearningPaths.FindAsync(nextId);

        if (prevPath == null || nextPath == null) return Results.NotFound("One or both paths not found.");

        prevPath.NextLearningPathId = nextId;
        nextPath.PrevLearningPathId = prevId;

        await db.SaveChangesAsync();
        return Results.Ok("Paths linked successfully.");
    }
}
