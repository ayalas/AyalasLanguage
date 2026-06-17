using System;
using System.Security.Claims;
using AyalasLanguageAPI.Data;

namespace AyalasLanguageAPI.Auth;

public static class AuthExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var idClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(idClaim, out int id) ? id : 0;
    }

    public static void AddAuthenticationSchemes(this WebApplicationBuilder builder)
    {
        builder.Services.AddAuthentication(options =>
        {
            // Default depends on your most common usage
            options.DefaultScheme = "PublicAuth";
        })
        .AddScheme<CacheAuthOptions, CacheAuthHandler>("PublicAuth", options =>
        {
            options.CookieName = Constants.APP_COOKIE_NAME;
        })
        .AddScheme<CacheAuthOptions, CacheAuthHandler>("AdminAuth", options =>
        {
            options.CookieName = Constants.ADMIN_APP_COOKIE_NAME;
        });
    }
}
