using System;
using System.Security.Claims;
using System.Text.Encodings.Web;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AyalasLanguageAPI.Auth;

public class CacheAuthHandler : AuthenticationHandler<CacheAuthOptions>
{
    private readonly IMemoryCache _cache;

    public CacheAuthHandler(
        IOptionsMonitor<CacheAuthOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IMemoryCache cache) : base(options, logger, encoder)
    {
        _cache = cache;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        string? rawToken = Request.Cookies[Options.CookieName];

        if (string.IsNullOrEmpty(rawToken))
        {
            string? authHeader = Request.Headers.Authorization;
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                rawToken = authHeader["Bearer ".Length..].Trim();
            }
        }

        if (string.IsNullOrEmpty(rawToken))
            return AuthenticateResult.Fail("No token found in cookie or header");

        AppIdEnum appId = Options.CookieName == Constants.ADMIN_APP_COOKIE_NAME 
            ? AppIdEnum.Admin 
            : AppIdEnum.Main;

        // Hash the token so we never search or cache raw tokens
        string tokenHash = TokenGenerator.HashToken(rawToken);
        string cacheKey = $"sess:{appId}:{tokenHash}";

        if (!_cache.TryGetValue(cacheKey, out CachedUserSession? session) || session == null)
        {
            var db = Request.HttpContext.RequestServices.GetRequiredService<AyalasLanguageDbContext>();

            // Query indexed Hash directly, selecting only needed columns
            var tokenRecord = await db.Tokens
                .AsNoTracking()
                .Where(t => t.TokenHash == tokenHash && t.AppId == (byte)appId)
                .Select(t => new
                {
                    t.TokenId,
                    t.ExpiresOn,
                    t.UserId,
                    t.User.UserName,
                    t.User.Role
                })
                .FirstOrDefaultAsync();

            if (tokenRecord == null || tokenRecord.ExpiresOn < DateTime.UtcNow)
                return AuthenticateResult.Fail("Invalid or Expired Token");

            session = new CachedUserSession(
                tokenRecord.UserId,
                tokenRecord.UserName,
                tokenRecord.Role,
                tokenRecord.ExpiresOn
            );

            // Bounded cache insertion with explicit Size = 1
            var cacheEntryOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(tokenRecord.ExpiresOn)
                .SetSize(1);

            _cache.Set(cacheKey, session, cacheEntryOptions);

            await db.Tokens.Where(t => t.TokenId == tokenRecord.TokenId)
                .ExecuteUpdateAsync(s => s.SetProperty(b => b.LastUsedAt, DateTime.UtcNow));
        }

        if (appId == AppIdEnum.Admin && session.Role != (byte)UserRoleEnum.Admin)
            return AuthenticateResult.Fail("Non-admin user attempt to access admin resources");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, session.UserId.ToString()),
            new Claim(ClaimTypes.Name, session.UserName),
            new Claim(ClaimTypes.Role, ((UserRoleEnum)session.Role).ToString())
        };

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return AuthenticateResult.Success(ticket);
    }
}