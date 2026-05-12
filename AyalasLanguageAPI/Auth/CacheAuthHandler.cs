using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using AyalasLanguageAPI.Data;
using System.Text.Encodings.Web;
using AyalasLanguageAPI.Model;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageAPI.Auth;

public class CacheAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly IMemoryCache _cache;

    public CacheAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IMemoryCache cache) : base(options, logger, encoder)
    {
        _cache = cache;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // 1. Check for Authorization header
        if (!Request.Headers.ContainsKey("Authorization"))
            return AuthenticateResult.Fail("Missing Header");

        string authHeader = Request.Headers.Authorization;
        var token = authHeader.Replace("Bearer ", "");

        User user = null;
        // 2. Look up user in cache
        if (!_cache.TryGetValue(token, out user))
        {
            // Optionally, you could also check the database for the token if it's not in cache
            var db = Request.HttpContext.RequestServices.GetRequiredService<AyalasLanguageDbContext>();
            var tokenRecord = await db.Tokens.FirstOrDefaultAsync(t => t.Content == token);

            if (tokenRecord == null || tokenRecord.ExpiresOn < DateTime.UtcNow)
                return AuthenticateResult.Fail("Invalid or Expired Token");
            user = tokenRecord.User;
        }

        // 3. Create "Claims" (This represents the user in the context)
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier.ToString(), user.UserId.ToString()),
            new Claim(ClaimTypes.Name.ToString(), user.UserName),
            new Claim(ClaimTypes.Role.ToString(), ((UserRoleEnum)user.Role).ToString())
        };

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return AuthenticateResult.Success(ticket);
    }
}