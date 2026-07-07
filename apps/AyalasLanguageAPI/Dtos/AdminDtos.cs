using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;

namespace AyalasLanguageAPI.AdminDTOs
{
    public record AdminUserIdDto(int UserId, string DisplayName, string UserName, byte Role, bool EmailConfirmed, bool Use2FALogin);
    public record AdminLoginResponseDto(DateTime Expires, AdminUserIdDto? User, bool Requires2FA, string? Verify2FAToken);

    public record AdminVerify2FARequest(string Verify2FAToken, string Code);
    public record AdminLoginDto(string UserName, string Password);

    //grid dtos
    public record AdminUserRowDto(int UserId, string DisplayName, string UserName, byte Role, bool EmailConfirmed, bool Use2FALogin, string? KnownLanguage, string? TargetLanguage, DateTime CreatedOn);
    public record AdminUserDetailsDto(int UserId, string DisplayName, string UserName, byte Role, bool EmailConfirmed, bool Use2FALogin, string? KnownLanguage, string? TargetLanguage, DateTime CreatedOn,
        bool DisablePuter, byte? NumOfExercisesToGenerate, DateTime? ForgotEmailSent,
        DateTime? ForgotEmailReceived, DateTime? EmailConfirmationReceived,
        DateTime? ConfirmationEmailSent);
    public record AdminContactUsRowDto(int ContactUsId, int? UserId, string? DisplayName, string Email, string? Message, DateTime CreatedOn);
    public record AdminLogRowDto(int LogId, int? UserId, string? Email, LogTypeEnum LogType, string? Description, DateTime CreatedOn);
    public record AdminJobRowDto(int JobId, int? MainRecordId, int? SecondaryRecordId, string? ExtraData, JobTypeEnum JobType, JobStatusEnum JobStatus, DateTime CreatedOn, DateTime ModifiedOn, string? FirstError, int Completed, int Errors, int? LeftToProcess);

    public record AdminExerciseRowDto(int? UserId, string? Email, string? KnownLanguage, string? TargetLanguage, string? Name, string Data, int ExerciseTypeId, string ExerciseType, DateTime CreatedOn, int? LearningPathId, int ExerciseId, byte Status);
    public record AdminLearningPathRowDto(int? UserId, string? Email, string? KnownLanguage, string? TargetLanguage, string? Name, uint Level, decimal Chapter, DateTime CreatedOn, int LearningPathId, int CountExercises, byte Status);
    public record AdminSetUserRoleRequest(int UserId, byte Role);
    public record AdminSetLearningPathStatusRequest(int LearningPathId, ContentStatusEnum Status);
    public record AdminMultiSetLearningPathStatusRequest(int[] LearningPathIds, ContentStatusEnum Status);
    public record AdminSetExerciseStatusRequest(int ExerciseId, ContentStatusEnum Status);
    public record AdminMultiSetExerciseStatusRequest(int[] ExerciseIds, ContentStatusEnum Status);
    public record AdminGridResponse<T>(int NumOfRecords, T[] Data);

    public record AdminLoginRowDto(int? UserId, string? Email,byte AppId, DateTime CreatedOn, DateTime ExpiresOn);
    
    public record AdminDashboardCountersResponse(int ContactUsRecordsTotal, int LogsTotal, int LessonsTotal, int DraftLessonsTotal, int ExercisesTotal, 
        int UsersTotal, int LoginsTotal, int IncompleteJobsTotal, int FailedJobsTotal);
}