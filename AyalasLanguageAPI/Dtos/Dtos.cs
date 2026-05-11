using System;

namespace AyalasLanguageAPI.DTOs
{
    // Auth DTOs
    public record UserRegisterDto(string DisplayName, string UserName, string Password);
    public record UserResponseDto(int UserId, string DisplayName, string UserName, byte Role);

    // Language DTOs
    public record LanguageDto(int LanguageId, string EnglishName, string? NativeName);
    public record SelectLanguageDto(int LanguageId, bool IsLearning);

    // Learning Path & Progress
    public record LearningPathDto(int LearningPathId, uint Level, byte Chapter, string? Name, int LanguageId);
    public record UpdateProgressDto(int LearningPathId, int LanguageId, byte Status);

    // Exercise DTOs
    public record ExerciseDto(int ExerciseId, int ExerciseTypeId, string Data);

    public record LearningPathCreateDto(
        int LanguageId, 
        uint Level, 
        byte Chapter, 
        string? Name, 
        int CreatorUserId,
        int? PrevLearningPathId = null, 
        int? NextLearningPathId = null
    );

    public record ExerciseCreateDto(
        int LanguageId, 
        int? LearningPathId, 
        int ExerciseTypeId, 
        string Data, 
        int CreatorUserId
    );
}