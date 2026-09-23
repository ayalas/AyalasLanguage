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
    private readonly ILogger<CacheAuthHandler> _logger;

    public CacheAuthHandler(
        IOptionsMonitor<CacheAuthOptions> options,
        ILoggerFactory loggerFactory,
        UrlEncoder encoder,
        IMemoryCache cache) : base(options, loggerFactory, encoder)
    {
        _cache = cache;
        _logger = loggerFactory.CreateLogger<CacheAuthHandler>();
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        string? rawToken = null;

        // 1. Check Authorization Header FIRST (critical for Mobile clients)
        string? authHeader = Request.Headers.Authorization;
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            rawToken = authHeader["Bearer ".Length..].Trim().Trim('"');
        }

        // 2. Fall back to Cookie (for Web clients)
        if (string.IsNullOrEmpty(rawToken))
        {
            rawToken = Request.Cookies[Options.CookieName];
        }

        if (string.IsNullOrWhiteSpace(rawToken))
        {
            _logger.LogDebug("Auth failed: No token found in Authorization header or cookie '{CookieName}'", Options.CookieName);
            return AuthenticateResult.NoResult();
        }

        AppIdEnum appId = Options.CookieName == Constants.ADMIN_APP_COOKIE_NAME 
            ? AppIdEnum.Admin 
            : AppIdEnum.Main;

        string tokenHash = TokenGenerator.HashToken(rawToken);
        string cacheKey = $"sess:{appId}:{tokenHash}";

        if (!_cache.TryGetValue(cacheKey, out CachedUserSession? session) || session == null)
        {
            var db = Request.HttpContext.RequestServices.GetRequiredService<AyalasLanguageDbContext>();

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

            if (tokenRecord == null)
            {
                _logger.LogWarning("Auth failed: Token not found in DB for hash {TokenHash} and appId {AppId}", tokenHash, appId);
                return AuthenticateResult.Fail("Invalid Token");
            }

            if (tokenRecord.ExpiresOn < DateTime.UtcNow)
            {
                _logger.LogWarning("Auth failed: Token expired at {ExpiresOn} UTC", tokenRecord.ExpiresOn);
                return AuthenticateResult.Fail("Expired Token");
            }

            session = new CachedUserSession(
                tokenRecord.UserId,
                tokenRecord.UserName,
                tokenRecord.Role,
                tokenRecord.ExpiresOn
            );

            var cacheEntryOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(tokenRecord.ExpiresOn)
                .SetSize(1);

            _cache.Set(cacheKey, session, cacheEntryOptions);

            _ = db.Tokens.Where(t => t.TokenId == tokenRecord.TokenId)
                .ExecuteUpdateAsync(s => s.SetProperty(b => b.LastUsedAt, DateTime.UtcNow));
        }

        if (appId == AppIdEnum.Admin && session.Role != (byte)UserRoleEnum.Admin)
        {
            _logger.LogWarning("Auth failed: User {UserId} is not admin for admin resource", session.UserId);
            return AuthenticateResult.Fail("Non-admin user attempt to access admin resources");
        }

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