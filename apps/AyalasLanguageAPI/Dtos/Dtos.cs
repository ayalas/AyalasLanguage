using System;
using AyalasLanguageAPI.Data;

namespace AyalasLanguageAPI.DTOs
{
    // Auth DTOs
    public record LoginResponseDto(DateTime Expires, UserIdDto? User, bool Requires2FA, string? Verify2FAToken);

    public record Verify2FARequest(string Verify2FAToken, string Code);
    public record RegisterDto(string DisplayName, string UserName, string Password);
    public record RegisterResponseDto(int UserId, string DisplayName, string UserName, byte Role);
    public record ChangeAccountDto(string? NewUserName, string OldPassword, string? NewPassword, bool Use2FALogin, string DisplayName);
    public record LoginDto(string UserName, string Password);
    public record ForgotPasswordDto(string UserName);
    //profile DTOs
    public record ResetPasswordDto(string UserName, string Password, string Token);
    public record UserProfileDto(string DisplayName, List<UserLanguageDto> Languages, List<UserExerciseTypeDto> ExerciseTypes, SwitchLanguageDto Current);
    public record EditUserProfileDto(string DisplayName, List<UserLanguageDto> Languages, List<UserExerciseTypeDto> ExerciseTypes);
    public record SwitchLanguageDto(int? TargetLanguageId, int? KnownLanguageId);
    public record CurrentLanguageResponseDto(int? TargetLanguageId,string? TargetLanguage, int? KnownLanguageId, string? KnownLanguage, LanguageDto[] otherUserLanguages, bool TargetLanguageIsRightToLeft, string? TargetLanguageEnglishName, string? TargetLanguageCode, int Score);
    public record UserIdDto(int UserId, string DisplayName, string UserName, byte Role, bool EmailConfirmed, bool Use2FALogin, CurrentLanguageResponseDto languageSettings);
    public record UserLanguageDto(int LanguageId, bool IsLearning);


    public record UserExerciseTypeDto(int ExerciseTypeId);

    // Static DTOs
    public record LanguageDto(int LanguageId, string? Code, string EnglishName, string? NativeName);
    
    // Learning Path & Progress
    public record LearningPathDto(int LearningPathId, uint Level, decimal Chapter, string? Name,  int? Status = null,  int ExerciseCount = 0, int? PrevLearningPathId = null, int? NextLearningPathId = null, bool practiseMistakesInThisPath = false);
    public record LearningPathSingleDto(int LearningPathId, uint Level, decimal Chapter, string? Name,  int? Status = null, int? ExerciseId = null,  int ExerciseCount = 0, int? PrevLearningPathId = null, int? NextLearningPathId = null, byte Access = 0, bool practiseMistakesInThisPath = false);

    
    public record UpdateProgressDto(int LearningPathId, int? exerciseId, bool? practiseMistakesInThisPath);

    public record AddMistakeDto(int ExerciseId);
    // Exercise DTOs
    public record ExerciseDto(int ExerciseId, int ExerciseTypeId, string Data, byte Access, int? LearningPathId);

    public record NextChapterDto(int Level, decimal ChapterHint);
    public record NextChapterResponseDto(decimal Chapter);
    // Content Creator DTOs
    public record CreateLearningPathDto(
        uint Level,
        decimal Chapter,
        string? Name,
        int? PrevLearningPathId = null,
        int? NextLearningPathId = null
    );
    public record CreateLearningPathResponseDto(int LearningPathId);
    public record EditLearningPathDto(uint Level, decimal Chapter, string? Name);
    
    public record CreateExerciseDto(
        int? LearningPathId, 
        int ExerciseTypeId, 
        string Data
    );
    public record CreateExerciseResponseDto(int ExerciseId);

    public record EditExerciseDto(
        string Data
    );

    public record AddScoreDto(int ScoreToAdd);

    public record ContactUsPublicDto(string Email, string Message);

    public record UserContactUsDto(string Message);

    public record CreateLogRequestDto(LogTypeEnum LogType, string Description);
}