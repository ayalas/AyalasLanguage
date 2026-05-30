using System;
using System.Security.Claims;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace AyalasLanguageAPI.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/auth").WithTags("Auth");

        auth.MapPost("/register", RegisterUser);
        auth.MapPost("/login", LoginUser);
        auth.MapPost("/logout", LogoutUser);
        auth.MapPost("/change-password", ChangeUserPassword);
        auth.MapGet("/me", CheckAuthStatus);
        //not implementing email confirmation, forgot password, or other features for this demo - but they would go here
    }
    [Authorize]
    private static async Task<IResult> CheckAuthStatus(ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();

        UserIdDto? userIdDto = await GetUserById(userId, db);
        if (userIdDto == null) return Results.BadRequest("User not found");

        return Results.Ok(userIdDto);
    }
    // --- Private Handler Implementations ---
    private static async Task<IResult> LoginUser(LoginDto login, IConfiguration config, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context)
    {
        // 1. Find user (In production, use a proper password hasher!)
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserName == login.UserName);
        if (user == null || !BCrypt.Net.BCrypt.Verify(login.Password, user.PasswordHash))
            return Results.Unauthorized();

        // 2. Generate a unique token: improve this in production (e.g. JWT or GUID + HMAC)
        var tokenContent = TokenGenerator.GenerateToken(); // Implement a secure token generator
        var expires = DateTime.UtcNow.AddHours(config.GetValue<int>("Session:TokenExpirationHours"));

        var tokenEntry = new Token
        {
            UserId = user.UserId,
            Content = tokenContent,
            ExpiresOn = expires
        };

        UserIdDto? userIdDto = await GetUserById(user.UserId, db);
        if (userIdDto == null) return Results.InternalServerError("Could not retrieve user");

        // 3. Save to DB (for persistence/audit)
        db.Tokens.Add(tokenEntry);
        await db.SaveChangesAsync();

        // 4. Cache the User object keyed by the Token Content
        // We cache the User so we don't have to query the DB in the middleware
        cache.Set(tokenContent, user, expires);

        context.Response.Cookies.Append(Constants.APP_COOKIE_NAME, tokenContent, new CookieOptions
        {
            HttpOnly = true,   // ◄ CRITICAL: Darkens the cookie to JavaScript/React
            Secure = true,     // ◄ Forces HTTPS in production
            SameSite = SameSiteMode.Strict // ◄ Protects against CSRF attacks
        });

        return Results.Ok(new LoginResponseDto(expires, userIdDto));
    }

    public static async Task<UserIdDto?> GetUserById(int userId, AyalasLanguageDbContext db)
    {
        var user = await db.Users
            .Include(u => u.KnownLanguage)
            .Include(u => u.TargetLanguage)
            .FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null) return null;

        var otherLanguages = await db.UserLanguages
            .Include(ul => ul.Language)
            .Where((ul) => ul.UserId == userId
            && ul.LanguageId != user.TargetLanguageId
            && ul.IsLearning)
            .Select((ul) => new LanguageDto(
                ul.LanguageId, ul.Language.Code, ul.Language.EnglishName, ul.Language.NativeName
            ))
        .ToArrayAsync();

        var languageSettings = new CurrentLanguageResponseDto(user.TargetLanguageId, user.TargetLanguage?.NativeName, user.KnownLanguageId, user.KnownLanguage?.NativeName, otherLanguages, user.TargetLanguage != null && user.TargetLanguage.IsRightToLeft);

        return new UserIdDto(user.UserId, user.DisplayName, user.UserName, user.Role, languageSettings);
    }

    [Authorize]
    private static async Task<IResult> LogoutUser(ClaimsPrincipal claim, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context, IConfiguration config)
    {
        var userId = claim.GetUserId();

        // Remove all tokens from DB and cache - keep the tokens table clean and simple
        var tokenEntry = await db.Tokens.Where(t => t.UserId == userId).ToListAsync();
        if (tokenEntry != null && tokenEntry.Any())
        {
            foreach (var token in tokenEntry)
            {
                db.Tokens.Remove(token);
                // Remove from Cache
                cache.Remove(token.Content);
            }
            await db.SaveChangesAsync();


            context.Response.Cookies.Delete(Constants.APP_COOKIE_NAME);
        }

        return Results.NoContent();
    }

    private static async Task<IResult> RegisterUser(RegisterDto dto, AyalasLanguageDbContext db)
    {

        if (await db.Users.FirstOrDefaultAsync(u => u.UserName == dto.UserName) != null)
        {
            return Results.Conflict("Username already exists.");
        }

        var user = new User
        {
            DisplayName = dto.DisplayName,
            UserName = dto.UserName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = (byte)UserRoleEnum.ContentCreator
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Results.Created($"/api/users/{user.UserId}",
            new RegisterResponseDto(user.UserId, user.DisplayName, user.UserName, user.Role));
    }

    [Authorize]
    private static async Task<IResult> ChangeUserPassword(ClaimsPrincipal claim, ChangePasswordDto dto, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null) return Results.NotFound();

        if (!BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash))
        {
            return Results.BadRequest("Old password is incorrect.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await db.SaveChangesAsync();

        return Results.NoContent();
    }
}
