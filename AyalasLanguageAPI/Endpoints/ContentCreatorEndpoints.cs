using System;

namespace AyalasLanguageAPI.Endpoints;

using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Model;
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

    private static async Task<IResult> CreateLearningPath(LearningPathCreateDto dto, AyalasLanguageDbContext db)
    {
        var path = new LearningPath
        {
            LanguageId = dto.LanguageId,
            Level = dto.Level,
            Chapter = dto.Chapter,
            Name = dto.Name,
            PrevLearningPathId = dto.PrevLearningPathId,
            NextLearningPathId = dto.NextLearningPathId,
            Status = 1, // Default to active/published
            UserId = dto.CreatorUserId
        };

        db.LearningPaths.Add(path);
        await db.SaveChangesAsync();

        return Results.Created($"/api/learning/path/{path.LearningPathId}", path);
    }

    private static async Task<IResult> CreateExercise(ExerciseCreateDto dto, AyalasLanguageDbContext db)
    {
        var exercise = new Exercise
        {
            LanguageId = dto.LanguageId,
            LearningPathId = dto.LearningPathId,
            ExerciseTypeId = dto.ExerciseTypeId,
            Data = dto.Data,
            UserId = dto.CreatorUserId
        };

        db.Exercises.Add(exercise);
        await db.SaveChangesAsync();

        return Results.Created($"/api/learning/exercise/{exercise.ExerciseId}", exercise);
    }

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
