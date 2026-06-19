using AyalasLanguageAPI.Data;

namespace AyalasLanguageAPI.AdminDTOs
{
    public record AdminUserIdDto(int UserId, string DisplayName, string UserName, byte Role, bool EmailConfirmed, bool Use2FALogin);
    public record AdminLoginResponseDto(DateTime Expires, AdminUserIdDto? User, bool Requires2FA, string? Verify2FAToken);

    public record AdminVerify2FARequest(string Verify2FAToken, string Code);
    public record AdminLoginDto(string UserName, string Password);

    //grid dtos
    public record AdminUserRowDto(int UserId, string DisplayName, string UserName, byte Role, bool EmailConfirmed, bool Use2FALogin, string? KnownLanguage, string? TargetLanguage);

    public record AdminContactUsRowDto(int ContactUsId, int? UserId, string? DisplayName, string Email, string? Message, DateTime CreatedOn);
    public record AdminLogRowDto(int LogId, int? UserId, string? Email, LogTypeEnum LogType, string? Description, DateTime CreatedOn);
    public record AdminSetUserRoleRequest(int UserId, byte Role);

    public record AdminGridResponse<T>(int NumOfRecords, T[] Data);
}