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
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app, string prefix)
    {
        var authBase = app.MapGroup($"{prefix}/auth").AddEndpointFilter<ErrorLoggingFilter>();

        var publicAuth = authBase.MapGroup("").WithTags("PublicAuth");

        var secureAuth = authBase.MapGroup("")
            .WithTags("SecureAuth")
            .RequireAuthorization(new AuthorizeAttribute
            {
                AuthenticationSchemes = "PublicAuth"
            });

        publicAuth.MapPost("/register", RegisterUser);
        publicAuth.MapPost("/login", LoginUser);
        publicAuth.MapPost("/verify2fa", Verify2FA);
        publicAuth.MapPost("/forgot", ForgotPasswordStart);
        publicAuth.MapPost("/reset", ForgotPasswordEnd);

        secureAuth.MapPost("/logout", LogoutUser);
        secureAuth.MapPost("/account", ChangeAccount);
        secureAuth.MapGet("/me", CheckAuthStatus);
        secureAuth.MapPost("/confirm", ConfirmEmailStart);
        secureAuth.MapGet("/confirm/{token}", ConfirmEmailEnd);
    }

    private static async Task<IResult> CheckAuthStatus(ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();

        UserIdDto? userIdDto = await GetUserById(userId, db);
        if (userIdDto == null) return Results.BadRequest("User not found");

        return Results.Ok(userIdDto);
    }

    private static async Task<IResult> LoginUser(LoginDto login, IConfiguration config, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context, ILogger<Program> logger)
    {
        if (!CacheUtils.ProtectByCacheCount(Constants.LOGIN_COUNT_CACHE_KEY, cache, Constants.MAX_LOGIN_PER_PERIOD))
        {
            return Results.Conflict("The system cannot accept new logins at this time. Please try again later.");
        }

        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserName == login.UserName);

        if (user == null || !BCrypt.Net.BCrypt.Verify(login.Password, user.PasswordHash))
            return Results.Conflict("Invalid credentials. Please try again with your correct email and password.");

        CacheUtils.AddToCountProtection(Constants.LOGIN_COUNT_CACHE_KEY, cache, Constants.CACHE_PROTECTION_MINUTES);

        if (user.EmailConfirmed && user.Use2FALogin)
        {
            string code = RandomNumberGenerator.GetInt32(Constants.MIN_2FA_CODE, Constants.MAX_2FA_CODE + 1).ToString();
            string tokenStart = TokenGenerator.GenerateToken();
            var expires = DateTime.UtcNow.AddMinutes(Constants.VERIFY2FA_TOKEN_EXPIRES_MINUTES);

            string raw2FaToken = $"{tokenStart}{code}";
            string tokenHash = TokenGenerator.HashToken(raw2FaToken);

            var tokenEntry = new Token
            {
                UserId = user.UserId,
                TokenHash = tokenHash,
                ExpiresOn = expires,
                AppId = (byte)AppIdEnum.Main2FA
            };
            db.Tokens.Add(tokenEntry);
            await db.SaveChangesAsync();

            var session = new CachedUserSession(user.UserId, user.UserName, user.Role, expires);
            cache.Set($"sess:{AppIdEnum.Main2FA}:{tokenHash}", session, new MemoryCacheEntryOptions
            {
                AbsoluteExpiration = expires,
                Size = 1
            });

            string emailTitle = $"{Constants.BRAND_NAME}: your two factor authentication code";
            string emailContent = $"<p>{code} is your two factor authentication code.</p>";

            await Utils.Utils.SendEmail(user.UserName, emailTitle, emailContent, config, logger);

            return Results.Ok(new LoginResponseDto(expires, null, true, tokenStart));
        }

        return await FinalizeLogin(user.UserId, user.UserName, user.Role, config, db, cache, context);
    }

    private static async Task<IResult> Verify2FA(Verify2FARequest req, IConfiguration config, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context)
    {
        if (!CacheUtils.ProtectByCacheCount(req.Verify2FAToken, cache, Constants.VERIFY2FA_TOKEN_MAX_RETRY))
        {
            return Results.Conflict("Too many entry attempts. Please restart the login process.");
        }

        string rawToken = $"{req.Verify2FAToken}{req.Code}";
        string tokenHash = TokenGenerator.HashToken(rawToken);
        string cacheKey = $"sess:{AppIdEnum.Main2FA}:{tokenHash}";
        DateTime now = DateTime.UtcNow;

        CachedUserSession? session;
        if (!cache.TryGetValue(cacheKey, out session) || session == null)
        {
            var tokenRecord = await db.Tokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.AppId == (byte)AppIdEnum.Main2FA);

            if (tokenRecord != null && tokenRecord.ExpiresOn >= now)
            {
                session = new CachedUserSession(tokenRecord.UserId, tokenRecord.User.UserName, tokenRecord.User.Role, tokenRecord.ExpiresOn);

                var consumed = await db.Tokens
                    .Where(t => t.TokenId == tokenRecord.TokenId && t.ExpiresOn >= now)
                    .ExecuteDeleteAsync();

                if (consumed != 1)
                {
                    session = null;
                }
            }
        }
        else
        {
            cache.Remove(cacheKey);

            var consumed = await db.Tokens
                .Where(t => t.TokenHash == tokenHash
                    && t.AppId == (byte)AppIdEnum.Main2FA
                    && t.ExpiresOn >= now)
                .ExecuteDeleteAsync();

            if (consumed != 1)
            {
                session = null;
            }
        }

        if (session != null)
        {
            return await FinalizeLogin(session.UserId, session.UserName, session.Role, config, db, cache, context);
        }

        CacheUtils.AddToCountProtection(req.Verify2FAToken, cache, Constants.VERIFY2FA_TOKEN_EXPIRES_MINUTES);
        return Results.Conflict("Expired or invalid two factor authentication code.");
    }

    private static async Task<IResult> FinalizeLogin(int userId, string userName, byte role, IConfiguration config, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context)
    {
        string rawToken = TokenGenerator.GenerateToken();
        string tokenHash = TokenGenerator.HashToken(rawToken);
        var expires = DateTime.UtcNow.AddHours(config.GetValue<int>("Session:TokenExpirationHours", 72));

        var tokenEntry = new Token
        {
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresOn = expires,
            AppId = (byte)AppIdEnum.Main,
            UserAgent = context.Request.Headers.UserAgent.ToString()
        };

        db.Tokens.Add(tokenEntry);
        await db.SaveChangesAsync();

        // Cache small session object with explicit Size
        var session = new CachedUserSession(userId, userName, role, expires);
        cache.Set($"sess:{AppIdEnum.Main}:{tokenHash}", session, new MemoryCacheEntryOptions
        {
            AbsoluteExpiration = expires,
            Size = 1
        });

        context.Response.Cookies.Append(Constants.APP_COOKIE_NAME, rawToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = new DateTimeOffset(expires),
            IsEssential = true
        });

        UserIdDto? userIdDto = await GetUserById(userId, db);
        return Results.Ok(new LoginResponseDto(expires, userIdDto, false, rawToken));
    }

    private static async Task<IResult> LogoutUser(ClaimsPrincipal claim, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context)
    {
        var userId = claim.GetUserId();

        // Remove token currently used
        string? rawToken = context.Request.Cookies[Constants.APP_COOKIE_NAME];
        if (!string.IsNullOrEmpty(rawToken))
        {
            string tokenHash = TokenGenerator.HashToken(rawToken);
            cache.Remove($"sess:{AppIdEnum.Main}:{tokenHash}");
        }

        // Delete all tokens belonging to this user
        await db.Tokens
            .Where(t => t.UserId == userId && (t.AppId == (byte)AppIdEnum.Main || t.AppId == (byte)AppIdEnum.Main2FA))
            .ExecuteDeleteAsync();

        context.Response.Cookies.Delete(Constants.APP_COOKIE_NAME);
        return Results.NoContent();
    }

    public static async Task<UserIdDto?> GetUserById(int userId, AyalasLanguageDbContext db)
    {
        var userData = await db.Users
            .AsNoTracking()
            .Where(u => u.UserId == userId)
            .Select(u => new
            {
                u.UserId,
                u.DisplayName,
                u.UserName,
                u.Role,
                u.EmailConfirmed,
                u.Use2FALogin,
                u.DisableAutoAI,
                u.ShowOnlyPrivateContent,
                u.NumOfExercisesToGenerate,
                u.TargetLanguageId,
                u.KnownLanguageId,
                KnownLanguageEnglishName = u.KnownLanguage != null ? u.KnownLanguage.EnglishName : null,
                KnownLanguageIsRtl = u.KnownLanguage != null && u.KnownLanguage.IsRightToLeft,
                TargetLanguageNativeName = u.TargetLanguage != null ? u.TargetLanguage.NativeName : null,
                TargetLanguageEnglishName = u.TargetLanguage != null ? u.TargetLanguage.EnglishName : null,
                TargetLanguageCode = u.TargetLanguage != null ? u.TargetLanguage.Code : null,
                TargetLanguageIsRtl = u.TargetLanguage != null && u.TargetLanguage.IsRightToLeft,
                TargetKeyboardLang = u.TargetLanguage != null
                    ? (u.TargetLanguage.KeyboardLanguageName ?? u.TargetLanguage.EnglishName)
                    : null
            })
            .FirstOrDefaultAsync();

        if (userData == null) return null;

        // Single query for unread messages, score, and active learning languages
        var unreadTask = db.UserMessages
            .AsNoTracking()
            .CountAsync(um => um.ToUserId == userId && !um.Read);

        var userLanguagesTask = db.UserLanguages
            .AsNoTracking()
            .Where(ul => ul.UserId == userId && ul.IsLearning)
            .Select(ul => new
            {
                ul.LanguageId,
                ul.Score,
                ul.Language.Code,
                ul.Language.EnglishName,
                ul.Language.NativeName
            })
            .ToListAsync();

        await Task.WhenAll(unreadTask, userLanguagesTask);

        int unreadCount = await unreadTask;
        var userLanguages = await userLanguagesTask;

        int userScore = userLanguages
            .FirstOrDefault(l => l.LanguageId == userData.TargetLanguageId)?.Score ?? 0;

        var otherLanguages = userLanguages
            .Where(ul => ul.LanguageId != userData.TargetLanguageId)
            .Select(ul => new LanguageDto(ul.LanguageId, ul.Code, ul.EnglishName, ul.NativeName))
            .ToArray();

        var languageSettings = new CurrentLanguageResponseDto(
            userData.TargetLanguageId,
            userData.TargetLanguageNativeName,
            userData.KnownLanguageId,
            userData.KnownLanguageEnglishName,
            otherLanguages,
            userData.KnownLanguageIsRtl,
            userData.TargetLanguageIsRtl,
            userData.TargetKeyboardLang,
            userData.TargetLanguageEnglishName,
            userData.TargetLanguageCode,
            userScore
        );

        return new UserIdDto(
            userData.UserId,
            userData.DisplayName,
            userData.UserName,
            userData.Role,
            userData.EmailConfirmed,
            userData.Use2FALogin,
            userData.DisableAutoAI,
            userData.ShowOnlyPrivateContent,
            userData.NumOfExercisesToGenerate,
            unreadCount,
            languageSettings
        );
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
            Role = (byte)UserRoleEnum.Learner
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        await SendConfirmationEmail(user, db, logger, config);

        CacheUtils.AddToCountProtection(Constants.REGISTER_COUNT_CACHE_KEY, cache, Constants.CACHE_PROTECTION_MINUTES);

        return Results.Created($"/api/users/{user.UserId}",
            new RegisterResponseDto(user.UserId, user.DisplayName, user.UserName, user.Role));
    }

    private static async Task<IResult> ChangeAccount(ChangeAccountDto dto, IMemoryCache cache, ClaimsPrincipal claim, AyalasLanguageDbContext db, ILogger<Program> logger, IConfiguration config)
    {
        var userId = claim.GetUserId();
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null) return Results.NotFound();

        bool was2fATurnedOff = false;

        if (!BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash))
        {
            return Results.BadRequest("Current password is incorrect.");
        }

        if (!user.EmailConfirmed)
        {
            if (!CacheUtils.ProtectByCacheCount(Constants.UNCONFIRMED_ACCOUNT_CHANGE_COUNT_CACHE_KEY, cache, Constants.MAX_REGISTER_PER_PERIOD))
            {
                return Results.Conflict("The system cannot accept unconfirmed accounts changes at this time. Please try again later.");
            }
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

        if (!user.EmailConfirmed)
        {
            CacheUtils.AddToCountProtection(Constants.UNCONFIRMED_ACCOUNT_CHANGE_COUNT_CACHE_KEY, cache, Constants.CACHE_PROTECTION_MINUTES);
        }

        if (was2fATurnedOff)
        {
            string emailTitle = $"NOTICE: {Constants.BRAND_NAME} two factor authentication turned off";
            string emailContent = $"<p>Your two factor authentication was turned off. If this wasn't you, please use {Constants.BRAND_NAME} Contact Us form to restore your account.</p>";

            await Utils.Utils.SendEmail(user.UserName, emailTitle, emailContent, config, logger);
        }

        UserIdDto? userIdDto = await GetUserById(user.UserId, db);

        return Results.Ok(userIdDto);
    }

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
        //promote to content creator once email is confirmed
        if (user.Role == (byte)UserRoleEnum.Learner)
            user.Role = (byte)UserRoleEnum.ContentCreator;
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

        CacheUtils.AddToCountProtection(Constants.FORGOT_COUNT_CACHE_KEY, cache, Constants.CACHE_PROTECTION_MINUTES);

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
