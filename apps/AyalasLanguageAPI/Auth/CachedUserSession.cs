namespace AyalasLanguageAPI.Auth;

public sealed record CachedUserSession(
    int UserId,
    string UserName,
    byte Role,
    DateTime ExpiresOn
);