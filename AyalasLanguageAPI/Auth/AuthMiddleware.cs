using System;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace AyalasLanguageAPI.Auth;

public static class AuthMiddleware
{
    public static void Authorize(this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            string authHeader = context.Request.Headers.Authorization;

            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
            {
                var token = authHeader.Substring(7);
                var cache = context.RequestServices.GetRequiredService<IMemoryCache>();

                // Try to get user from cache
                if (cache.TryGetValue(token, out User user))
                {
                    // Store the user object in Items so controllers can access it
                    context.Items["CurrentUser"] = user;
                }
                else
                {
                    // Optionally, you could also check the database for the token if it's not in cache
                    var db = context.RequestServices.GetRequiredService<AyalasLanguageDbContext>();
                    var tokenRecord = await db.Tokens.FirstOrDefaultAsync(t => t.Content == token);

                    if (tokenRecord != null && tokenRecord.ExpiresOn > DateTime.UtcNow)
                    {
                        // Cache the user for future requests
                        cache.Set(token, tokenRecord.User, tokenRecord.ExpiresOn - DateTime.UtcNow);
                        context.Items["CurrentUser"] = tokenRecord.User;
                    }
                }
            }

            await next();
        });
    }

    public static void FromCookieToAuthHeader(this WebApplication app, IConfiguration config)
    {
        if (config["ASPNETCORE_ENVIRONMENT"] == "Development")
        {
            // 1. Extract cookie and inject into Authorization header
            app.Use(async (context, next) =>
            {
                // Check if the Authorization header is missing but the auth cookie exists
                if (!context.Request.Headers.ContainsKey("Authorization") &&
                    context.Request.Cookies.TryGetValue(Constants.APP_COOKIE_NAME, out var token))
                {
                    // Inject it into the header so your existing auth middleware reads it perfectly
                    context.Request.Headers.Authorization = $"Bearer {token}";
                }

                await next(context);
            });
        }
    }
}
