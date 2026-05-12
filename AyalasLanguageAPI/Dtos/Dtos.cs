using System;

namespace AyalasLanguageAPI.DTOs
{
    // Auth DTOs
    public record LoginRequest(string UserName, string Password);
    public record UserRegisterDto(string DisplayName, string UserName, string Password);
    public record UserResponseDto(int UserId, string DisplayName, string UserName, byte Role);

    public record UserProfileDto(string DisplayName, List<UserLanguageDto> Languages, List<UserExerciseTypeDto> ExerciseTypes);
    public record EditUserProfileDto(string DisplayName, string Password, List<UserLanguageDto> Languages, List<UserExerciseTypeDto> ExerciseTypes);
    public record SwitchLanguageDto(int? TargetLanguageId, int? KnownLanguageId);

    public record UserLanguageDto(int LanguageId, bool IsLearning);

    public record UserExerciseTypeDto(int ExerciseTypeId);

    // Language DTOs
    public record LanguageDto(int LanguageId, string? Code, string EnglishName, string? NativeName);
    

    // Learning Path & Progress
    public record LearningPathDto(int LearningPathId, uint Level, byte Chapter, string? Name, int LanguageId, byte? Status = null);
    public record UpdateProgressDto(int LearningPathId, int LanguageId, byte Status);

    // Exercise DTOs
    public record ExerciseDto(int ExerciseId, int ExerciseTypeId, string Data);

    public record LearningPathCreateDto(
        int LanguageId, 
        uint Level, 
        byte Chapter, 
        string? Name, 
        int? PrevLearningPathId = null, 
        int? NextLearningPathId = null
    );

    public record ExerciseCreateDto(
        int LanguageId, 
        int? LearningPathId, 
        int ExerciseTypeId, 
        string Data
    );
}