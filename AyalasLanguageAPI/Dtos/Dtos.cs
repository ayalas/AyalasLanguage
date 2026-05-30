using System;

namespace AyalasLanguageAPI.DTOs
{
    // Auth DTOs
    public record LoginResponseDto(DateTime Expires, UserIdDto User);
    public record RegisterDto(string DisplayName, string UserName, string Password);
    public record RegisterResponseDto(int UserId, string DisplayName, string UserName, byte Role);
    public record ChangePasswordDto(string OldPassword, string NewPassword);
    public record LoginDto(string UserName, string Password);
    //profile DTOs
    public record UserProfileDto(string DisplayName, List<UserLanguageDto> Languages, List<UserExerciseTypeDto> ExerciseTypes, SwitchLanguageDto Current);
    public record EditUserProfileDto(string DisplayName, List<UserLanguageDto> Languages, List<UserExerciseTypeDto> ExerciseTypes);
    public record SwitchLanguageDto(int? TargetLanguageId, int? KnownLanguageId);
    public record CurrentLanguageResponseDto(int? TargetLanguageId,string? TargetLanguage, int? KnownLanguageId, string? KnownLanguage, LanguageDto[] otherUserLanguages, bool TargetLanguageIsRightToLeft, string? TargetLanguageEnglishName);
    public record UserIdDto(int UserId, string DisplayName, string UserName, byte Role, CurrentLanguageResponseDto languageSettings);
    public record UserLanguageDto(int LanguageId, bool IsLearning);


    public record UserExerciseTypeDto(int ExerciseTypeId);

    // Static DTOs
    public record LanguageDto(int LanguageId, string? Code, string EnglishName, string? NativeName);
    
    // Learning Path & Progress
    public record LearningPathDto(int LearningPathId, uint Level, byte Chapter, string? Name,  int? Status = null,  int ExerciseCount = 0, int? PrevLearningPathId = null, int? NextLearningPathId = null, bool practiseMistakesInThisPath = false);
    public record LearningPathSingleDto(int LearningPathId, uint Level, byte Chapter, string? Name,  int? Status = null, int? ExerciseId = null,  int ExerciseCount = 0, int? PrevLearningPathId = null, int? NextLearningPathId = null, byte Access = 0, bool practiseMistakesInThisPath = false);

    
    public record UpdateProgressDto(int LearningPathId, int? exerciseId, bool? practiseMistakesInThisPath);

    public record AddMistakeDto(int ExerciseId);
    // Exercise DTOs
    public record ExerciseDto(int ExerciseId, int ExerciseTypeId, string Data, byte Access);

    // Content Creator DTOs
    public record CreateLearningPathDto(
        uint Level,
        byte Chapter,
        string? Name,
        int? PrevLearningPathId = null,
        int? NextLearningPathId = null
    );
    public record CreateLearningPathResponseDto(int LearningPathId);
    public record EditLearningPathDto(uint Level, byte Chapter, string? Name);
    
    public record CreateExerciseDto(
        int? LearningPathId, 
        int ExerciseTypeId, 
        string Data
    );
    public record CreateExerciseResponseDto(int ExerciseId);

    public record EditExerciseDto(
        string Data
    );
}