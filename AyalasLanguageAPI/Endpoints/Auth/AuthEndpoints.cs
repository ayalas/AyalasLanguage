using System;
using System.Security.Claims;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Data.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Humanizer;
using System.Security.Cryptography;
using AyalasLanguageAPI.Utils;

namespace AyalasLanguageAPI.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/auth").WithTags("Auth");

        auth.MapPost("/register", RegisterUser);
        auth.MapPost("/login", LoginUser);
        auth.MapPost("/verify2fa", Verify2FA);
        auth.MapPost("/logout", LogoutUser);
        auth.MapPost("/account", ChangeAccount);
        auth.MapPost("/forgot", ForgotPasswordStart);
        auth.MapPost("/reset", ForgotPasswordEnd);
        auth.MapPost("/confirm", ConfirmEmailStart);
        auth.MapGet("/confirm/{token}", ConfirmEmailEnd);
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
    private static async Task<IResult> LoginUser(LoginDto login, IConfiguration config, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context, ILogger<Program> logger)
    {
        if (!CacheUtils.ProtectByCacheCount(Constants.LOGIN_COUNT_CACHE_KEY, cache, Constants.MAX_LOGIN_PER_PERIOD))
        {
            return Results.Conflict("The system cannot accept new logins at this time. Please try again later.");
        }

        // 1. Find user (In production, use a proper password hasher!)
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserName == login.UserName);
        if (user == null || !BCrypt.Net.BCrypt.Verify(login.Password, user.PasswordHash))
            return Results.Conflict("Invalid credentials. Please try again with your correct email and password.");

        CacheUtils.AddToCountProtection(Constants.LOGIN_COUNT_CACHE_KEY, cache, Constants.LOGIN_CACHE_PROTECTION_MINUTES);

        if (user.EmailConfirmed && user.Use2FALogin)
        {
            //generate code
            string code = Random.Shared.Next(Constants.MIN_2FA_CODE, Constants.MAX_2FA_CODE).ToString();
            var tokenStart = TokenGenerator.GenerateToken(); // Implement a secure token generator
            var expires = DateTime.UtcNow.AddMinutes(Constants.VERIFY2FA_TOKEN_EXPIRES_MINUTES);

            string token = $"{tokenStart}{code}";

            var tokenEntry = new Token
            {
                UserId = user.UserId,
                Content = token,
                ExpiresOn = expires
            };
            db.Tokens.Add(tokenEntry);
            await db.SaveChangesAsync();

            cache.Set(token, user, expires - DateTime.UtcNow);

            string emailTitle = $"{Constants.BRAND_NAME}: your two factor authentication code";
            string emailContent = $"<p>{code} is your two factor authentication code.</p>";

            await Utils.Utils.SendEmail(user.UserName, emailTitle, emailContent, config, logger);

            return Results.Ok(new LoginResponseDto(expires, null, true, tokenStart));
        }
        else
        {
            return await FinalizeLogin(user, config, db, cache, context);
        }
    }

    private static async Task<IResult> Verify2FA(Verify2FARequest req, IConfiguration config, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context)
    {
        if (!CacheUtils.ProtectByCacheCount(req.Verify2FAToken, cache, Constants.VERIFY2FA_TOKEN_MAX_RETRY))
        {
            return Results.Conflict("Too many entry attempts for two factor authentication code. Please restart the login process.");
        }

        string token = $"{req.Verify2FAToken}{req.Code}";
        if (cache.TryGetValue(token, out User? user) && user != null)
        {
            return await FinalizeLogin(user, config, db, cache, context);
        }
        else
        {
            var tokenRecord = await db.Tokens.Include(t => t.User).FirstOrDefaultAsync(t => t.Content == token);

            if (tokenRecord != null && tokenRecord.ExpiresOn.CompareTo(DateTime.UtcNow) >= 0)
            {
                return await FinalizeLogin(tokenRecord.User, config, db, cache, context);
            }
        }

        CacheUtils.AddToCountProtection(req.Verify2FAToken, cache, Constants.VERIFY2FA_TOKEN_EXPIRES_MINUTES);

        return Results.Conflict("Expired or invalid two factor authentication code. Please try again or restart the login process.");

    }

    private static async Task<IResult> FinalizeLogin(User user, IConfiguration config, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context)
    {
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

        bool BypassSecureCookies = config.GetValue<bool>(Constants.CONFIG_BYPASS_SECURE_COOKIES_KEY, false);

        context.Response.Cookies.Append(Constants.APP_COOKIE_NAME, tokenContent, new CookieOptions
        {
            HttpOnly = true,   // ◄ CRITICAL: Darkens the cookie to JavaScript/React
            Secure = !BypassSecureCookies,     // ◄ Forces HTTPS in production
            SameSite = SameSiteMode.Strict // ◄ Protects against CSRF attacks
            ,
            Expires = new DateTimeOffset(expires)
        });

        return Results.Ok(new LoginResponseDto(expires, userIdDto, false, null));
    }

    public static async Task<UserIdDto?> GetUserById(int userId, AyalasLanguageDbContext db)
    {
        var user = await db.Users
            .Include(u => u.KnownLanguage)
            .Include(u => u.TargetLanguage)
            .FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null) return null;

        int userScore = 0;
        if (user.TargetLanguageId != null)
        {
            UserLanguage? userLanguage = await db.UserLanguages.FirstOrDefaultAsync(ul => ul.UserId == userId && ul.LanguageId == user.TargetLanguageId.Value && ul.IsLearning == true);
            if (userLanguage != null)
            {
                userScore = userLanguage.Score;
            }
        }

        var otherLanguages = await db.UserLanguages
            .Include(ul => ul.Language)
            .Where((ul) => ul.UserId == userId
            && ul.LanguageId != user.TargetLanguageId
            && ul.IsLearning)
            .Select((ul) => new LanguageDto(
                ul.LanguageId, ul.Language.Code, ul.Language.EnglishName, ul.Language.NativeName
            ))
        .ToArrayAsync();

        var languageSettings = new CurrentLanguageResponseDto(user.TargetLanguageId,
            user.TargetLanguage?.NativeName, user.KnownLanguageId,
            user.KnownLanguage?.NativeName, otherLanguages,
            user.TargetLanguage != null && user.TargetLanguage.IsRightToLeft,
            user.TargetLanguage?.EnglishName,
            user.TargetLanguage?.Code, userScore);

        return new UserIdDto(user.UserId, user.DisplayName, user.UserName, user.Role, user.EmailConfirmed, user.Use2FALogin, languageSettings);
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

    private static async Task<IResult> RegisterUser(RegisterDto dto, IMemoryCache cache, AyalasLanguageDbContext db, ILogger<Program> logger, IConfiguration config)
    {
        if (!CacheUtils.ProtectByCacheCount(Constants.REGISTER_COUNT_CACHE_KEY, cache, Constants.MAX_REGISTER_PER_PERIOD))
        {
            return Results.Conflict("The system cannot accept new registrations at this time. Please try again later.");
        }

        if (await db.Users.FirstOrDefaultAsync(u => u.UserName == dto.UserName) != null)
        {
            return Results.Conflict("User already exists.");
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

        await SendConfirmationEmail(user, db, logger, config);

        CacheUtils.AddToCountProtection(Constants.REGISTER_COUNT_CACHE_KEY, cache, Constants.REGISTER_CACHE_PROTECTION_MINUTES);

        return Results.Created($"/api/users/{user.UserId}",
            new RegisterResponseDto(user.UserId, user.DisplayName, user.UserName, user.Role));
    }

    [Authorize]
    private static async Task<IResult> ChangeAccount(ChangeAccountDto dto, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger, IConfiguration config)
    {
        var userId = claim.GetUserId();
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null) return Results.NotFound();

        bool was2fATurnedOff = false;

        if (!BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash))
        {
            return Results.BadRequest("Old password is incorrect.");
        }

        if (dto.Use2FALogin)
        {
            if (user.EmailConfirmed)
            {
                user.Use2FALogin = true;
            }
            else
            {
                return Results.BadRequest("Cannot use two factor authentication when your email address is not confirmed.");
            }
        }
        else
        {
            was2fATurnedOff = user.Use2FALogin;
            user.Use2FALogin = false;
        }

        user.DisplayName = dto.DisplayName;

        if (dto.NewPassword != null && dto.NewPassword.Length > 0)
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        }

        if (dto.NewUserName != null && dto.NewUserName.Length > 0 && dto.NewUserName != user.UserName)
        {
            if (user.EmailConfirmed)
            {
                //cannot change confirmed address
                return Results.Forbid();
            }

            if (await db.Users.FirstOrDefaultAsync(u => u.UserName == dto.NewUserName) != null)
            {
                return Results.Conflict("Username already exists.");
            }

            user.UserName = dto.NewUserName;
        }
        await db.SaveChangesAsync();

        if (was2fATurnedOff)
        {
            string emailTitle = $"NOTICE: {Constants.BRAND_NAME} two factor authentication turned off";
            string emailContent = $"<p>Your two factor authentication was turned off. If this wasn't you, please use {Constants.BRAND_NAME} Contact Us form to restore your account.</p>";

            await Utils.Utils.SendEmail(user.UserName, emailTitle, emailContent, config, logger);
        }

        UserIdDto? userIdDto = await GetUserById(user.UserId, db);

        return Results.Ok(userIdDto);
    }

    [Authorize]
    private static async Task<IResult> ConfirmEmailStart(ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger, IConfiguration config)
    {
        var userId = claim.GetUserId();
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null) return Results.NotFound();

        if (user.EmailConfirmed)
            return Results.Conflict("Email address already confirmed");

        if (user.ConfirmationEmailSent != null)
        {
            DateTime minTimeForResend = user.ConfirmationEmailSent.Value.AddHours(config.GetValue<int>("EmailConfirmation:ResendDelayHours"));
            if (DateTime.UtcNow.CompareTo(minTimeForResend) < 0)
            {
                return Results.Conflict("An email address confirmation has already been sent earlier for this account. Go to your inbox and click the confirmation link within the email sent to you, or retry this in a few hours.");
            }
        }

        await SendConfirmationEmail(user, db, logger, config);

        return Results.Accepted();
    }

    [Authorize]
    private static async Task<IResult> ConfirmEmailEnd(string token, ClaimsPrincipal claim, AyalasLanguageDbContext db, IConfiguration config)
    {
        var userId = claim.GetUserId();
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserId == userId);


        if (user == null) return Results.NotFound();

        if (user.EmailConfirmed)
        {
            return Results.BadRequest("Email address is already confirmed for this account.");
        }

        if (user.EmailConfirmationToken == null || user.ConfirmationEmailSent == null)
        {
            return Results.Forbid();
        }

        DateTime dtTokenExpires = user.ConfirmationEmailSent.Value.AddHours(config.GetValue<int>("EmailConfirmation:TokenExpirationHours"));

        if (!BCrypt.Net.BCrypt.Verify(token, user.EmailConfirmationToken))
        {
            return Results.BadRequest("Invalid token.");
        }

        if (DateTime.UtcNow.CompareTo(dtTokenExpires) > 0)
        {
            return Results.Conflict("Token expired. Please resend an email address confirmation through the account page.");
        }

        user.EmailConfirmationReceived = DateTime.UtcNow;
        user.EmailConfirmed = true;
        user.EmailConfirmationToken = null;
        await db.SaveChangesAsync();

        UserIdDto? userIdDto = await GetUserById(user.UserId, db);
        return Results.Ok(userIdDto);
    }

    private static async Task<IResult> ForgotPasswordStart(ForgotPasswordDto dto, IMemoryCache cache, AyalasLanguageDbContext db, IConfiguration config, ILogger<Program> logger)
    {
        if (!CacheUtils.ProtectByCacheCount(Constants.FORGOT_COUNT_CACHE_KEY, cache, Constants.MAX_FORGOT_PER_PERIOD))
        {
            return Results.Conflict("The system cannot accept your request at this time. Please try again later.");
        }

        var user = await db.Users.FirstOrDefaultAsync(u => u.UserName == dto.UserName);
        if (user == null)
            return Results.Conflict("Email not found.");

        if (!user.EmailConfirmed)
        {
            return Results.Conflict("Cannot reset password for an account of unconfirmed email address.");
        }

        if (user.ForgotEmailSent != null)
        {
            DateTime minTimeForResend = user.ForgotEmailSent.Value.AddMinutes(config.GetValue<int>("ForgotPassword:ResendDelayMinutes"));
            if (DateTime.UtcNow.CompareTo(minTimeForResend) < 0)
            {
                return Results.Conflict("An password reset email has already been sent earlier for this account. Go to your inbox and click the link within the email sent to you to reset your password, or retry this in a few minutes.");
            }
        }

        (string rawToken, string hashedToken) = Utils.Utils.GenerateToken();

        user.ForgotPasswordToken = hashedToken;
        user.ForgotEmailSent = DateTime.UtcNow;
        await db.SaveChangesAsync();

        string? resetPwdPage = $"{config.GetValue<string>("ClientBaseAddress")}{Constants.CLIENT_RELATIVE_PATH_RESET_PASSWORD}{rawToken}?user={user.UserName}";

        string emailTitle = $"{Constants.BRAND_NAME}: reset your password";
        string emailContent = $"<p>Choose a new password for your account in this <a href=\"{resetPwdPage}\">link</a>. Notice the link expires shortly.</p>";

        await Utils.Utils.SendEmail(user.UserName, emailTitle, emailContent, config, logger);

        CacheUtils.AddToCountProtection(Constants.FORGOT_COUNT_CACHE_KEY, cache, Constants.FORGOT_CACHE_PROTECTION_MINUTES);

        return Results.Accepted();
    }

    private static async Task<IResult> ForgotPasswordEnd(ResetPasswordDto dto, AyalasLanguageDbContext db, IConfiguration config)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserName == dto.UserName);
        if (user == null) return Results.NotFound();

        if (user.ForgotPasswordToken == null || user.ForgotEmailSent == null)
        {
            return Results.Forbid();
        }

        DateTime dtTokenExpires = user.ForgotEmailSent.Value.AddMinutes(config.GetValue<int>("ForgotPassword:TokenExpirationMinutes"));

        if (!BCrypt.Net.BCrypt.Verify(dto.Token, user.ForgotPasswordToken))
        {
            return Results.BadRequest("Invalid token.");
        }

        if (DateTime.UtcNow.CompareTo(dtTokenExpires) > 0)
        {
            return Results.Conflict("Token expired. Please try again in a few minutes.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        user.ForgotPasswordToken = null;
        user.ForgotEmailReceived = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Results.Ok();
    }
    private static async Task SendConfirmationEmail(User user, AyalasLanguageDbContext db, ILogger<Program> logger, IConfiguration config)
    {
        try
        {
            (string rawToken, string hashedToken) = Utils.Utils.GenerateToken();

            user.EmailConfirmationToken = hashedToken;
            user.ConfirmationEmailSent = DateTime.UtcNow;
            await db.SaveChangesAsync();

            string? confirmPageAddress = $"{config.GetValue<string>("ClientBaseAddress")}{Constants.CLIENT_RELATIVE_PATH_CONFIRM_EMAIL}{rawToken}";

            string emailTitle = $"{Constants.BRAND_NAME}: Confirm your email address";
            string emailContent = $"<p>Please confirm your email address by opening this <a href=\"{confirmPageAddress}\">confirmation link</a> in your browser.</p>";

            await Utils.Utils.SendEmail(user.UserName, emailTitle, emailContent, config, logger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Email confirmation send failed");
        }
    }
}
