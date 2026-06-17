namespace AyalasLanguageAPI.AdminDTOs
{
    public record AdminUserIdDto(int UserId, string DisplayName, string UserName, byte Role, bool EmailConfirmed, bool Use2FALogin);
    public record AdminLoginResponseDto(DateTime Expires, AdminUserIdDto? User, bool Requires2FA, string? Verify2FAToken);

    public record AdminVerify2FARequest(string Verify2FAToken, string Code);
    public record AdminLoginDto(string UserName, string Password);
}