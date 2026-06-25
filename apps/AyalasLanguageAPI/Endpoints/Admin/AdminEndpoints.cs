using System;
using System.Security.Claims;
using AyalasLanguageAPI.AdminDTOs;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using AyalasLanguageAPI.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using SQLitePCL;

namespace AyalasLanguageAPI.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var authBase = app.MapGroup("/admin/api/auth");
        authBase.AddEndpointFilter<ErrorLoggingFilter>();

        var publicAuth = authBase.MapGroup("").WithTags("AdminPublicAuth");

        var secureAuth = authBase.MapGroup("")
            .WithTags("AdminAuth")
            .RequireAuthorization(new AuthorizeAttribute
            {
                AuthenticationSchemes = "AdminAuth",
                Roles = "Admin"
            });

        publicAuth.MapPost("/login", LoginUser);
        publicAuth.MapPost("/verify2fa", Verify2FA);

        secureAuth.MapPost("/logout", LogoutUser);
        secureAuth.MapGet("/me", CheckAuthStatus);
        secureAuth.MapGet("/users/{page:int}", GetUsers);
        secureAuth.MapPost("/setuserrole", SetUserRole);

        var adminAPIsecured = app.MapGroup("/admin/api").AddEndpointFilter<ErrorLoggingFilter>().WithTags("AdminAPI")
            .RequireAuthorization(new AuthorizeAttribute
            {
                AuthenticationSchemes = "AdminAuth",
                Roles = "Admin"
            });

        adminAPIsecured.MapGet("/contactus/{page:int}", GetContactUsRecords);
        adminAPIsecured.MapGet("/logs/{page:int}", GetLogsRecords);
        adminAPIsecured.MapGet("/exercises/{page:int}", GetExercises);
        adminAPIsecured.MapGet("/learning-paths/{page:int}", GetLearningPaths);
        adminAPIsecured.MapGet("/learning-path/{learningPathId:int}", GetSingleLearningPath);
        adminAPIsecured.MapGet("/learning-path/{learningPathId:int}/exercises/{page:int}", GetLearningPathExercises);
        adminAPIsecured.MapPost("/setpathstatus", SetLearningPathStatus);
        adminAPIsecured.MapPost("/setexercisestatus", SetExerciseStatus);
        adminAPIsecured.MapPost("/multisetpathstatus", MultiSetLearningPathStatus);
        adminAPIsecured.MapPost("/multisetexercisestatus", MultiSetExerciseStatus);
        adminAPIsecured.MapGet("/dashboard/counters/{rangeFilter:int}", GetCountersDashboard);
    }

    private static async Task<IResult> CheckAuthStatus(ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();

        AdminUserIdDto? userIdDto = await GetUserById(userId, db);
        if (userIdDto == null) return Results.BadRequest("User not found");

        return Results.Ok(userIdDto);
    }

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


            context.Response.Cookies.Delete(Constants.ADMIN_APP_COOKIE_NAME);
        }

        return Results.NoContent();
    }

    private static async Task<IResult> LoginUser(AdminLoginDto login, IConfiguration config, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context, ILogger<Program> logger)
    {
        if (!CacheUtils.ProtectByCacheCount(Constants.ADMIN_LOGIN_COUNT_CACHE_KEY, cache, Constants.MAX_ADMIN_LOGIN_PER_PERIOD))
        {
            return Results.Conflict("The system cannot accept new logins at this time. Please try again later.");
        }

        // 1. Find user (In production, use a proper password hasher!)
        User? user = await db.Users.FirstOrDefaultAsync(u => u.UserName == login.UserName && u.Role == (int)UserRoleEnum.Admin);

        if (user == null || !BCrypt.Net.BCrypt.Verify(login.Password, user.PasswordHash))
            return Results.Conflict("Invalid credentials. Please try again with your correct email and password.");

        CacheUtils.AddToCountProtection(Constants.ADMIN_LOGIN_COUNT_CACHE_KEY, cache, Constants.CACHE_PROTECTION_MINUTES);

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

            return Results.Ok(new AdminLoginResponseDto(expires, null, true, tokenStart));
        }
        else
        {
            return await FinalizeLogin(user, config, db, cache, context);
        }
    }

    private static async Task<IResult> Verify2FA(AdminVerify2FARequest req, IConfiguration config, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context)
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

        AdminUserIdDto? userIdDto = await GetUserById(user.UserId, db);
        if (userIdDto == null) return Results.InternalServerError("Could not retrieve user");

        // 3. Save to DB (for persistence/audit)
        db.Tokens.Add(tokenEntry);
        await db.SaveChangesAsync();

        // 4. Cache the User object keyed by the Token Content
        // We cache the User so we don't have to query the DB in the middleware
        cache.Set(tokenContent, user, expires);

        bool BypassSecureCookies = config.GetValue<bool>(Constants.CONFIG_BYPASS_SECURE_COOKIES_KEY, false);

        context.Response.Cookies.Append(Constants.ADMIN_APP_COOKIE_NAME, tokenContent, new CookieOptions
        {
            HttpOnly = true,   // ◄ CRITICAL: Darkens the cookie to JavaScript/React
            Secure = !BypassSecureCookies,     // ◄ Forces HTTPS in production
            SameSite = SameSiteMode.Strict // ◄ Protects against CSRF attacks
            ,
            Expires = new DateTimeOffset(expires)
        });

        return Results.Ok(new AdminLoginResponseDto(expires, userIdDto, false, null));
    }

    private static async Task<AdminUserIdDto?> GetUserById(int userId, AyalasLanguageDbContext db)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.UserId == userId && u.Role == (int)UserRoleEnum.Admin);
        if (user == null) return null;

        return new AdminUserIdDto(user.UserId, user.DisplayName, user.UserName, user.Role, user.EmailConfirmed, user.Use2FALogin);
    }

    private static async Task<AdminGridResponse<AdminUserRowDto>> GetUsers(int page, AyalasLanguageDbContext db)
    {
        var arr = await db.Users
            .Include(u => u.KnownLanguage)
            .Include(u => u.TargetLanguage)
            .Select(u => new AdminUserRowDto(
            u.UserId,
            u.DisplayName,
            u.UserName,
            u.Role,
            u.EmailConfirmed,
            u.Use2FALogin,
            u.KnownLanguage == null ? null : u.KnownLanguage.EnglishName,
            u.TargetLanguage == null ? null : u.TargetLanguage.EnglishName
        )).Skip(page * Constants.PAGE_SIZE).Take(Constants.PAGE_SIZE + 1).ToArrayAsync();

        int numOfRecords = 0;
        if (page == 0)
            numOfRecords = await db.Users.CountAsync();
        return new AdminGridResponse<AdminUserRowDto>(numOfRecords, arr);
    }

    private static async Task<AdminGridResponse<AdminContactUsRowDto>?> GetContactUsRecords(int page, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var arr = await db.ContactUs
            .Include(c => c.User)
            .OrderByDescending(c => c.ContactUsId)
            .Select(c => new AdminContactUsRowDto(
            c.ContactUsId,
            c.UserId,
            c.User != null ? c.User.DisplayName : null,
            c.Email,
            c.Message,
            c.CreatedOn
        )).Skip(page * Constants.PAGE_SIZE).Take(Constants.PAGE_SIZE + 1).ToArrayAsync();

        int numOfRecords = 0;
        if (page == 0)
            numOfRecords = await db.ContactUs.CountAsync();
        return new AdminGridResponse<AdminContactUsRowDto>(numOfRecords, arr);
    }

    private static async Task<AdminGridResponse<AdminLogRowDto>> GetLogsRecords(int page, IMemoryCache cache, AyalasLanguageDbContext db)
    {
        var arr = await db.Logs
            .Include(l => l.User)
            .OrderByDescending(l => l.LogId)
            .Select(l => new AdminLogRowDto(
            l.LogId,
            l.UserId,
            l.User != null ? l.User.UserName : null,
            (LogTypeEnum)l.LogType,
            l.Description,
            l.CreatedOn
        )).Skip(page * Constants.PAGE_SIZE).Take(Constants.PAGE_SIZE + 1).ToArrayAsync();

        int numOfRecords = 0;
        if (page == 0)
            numOfRecords = await db.Logs.CountAsync();
        return new AdminGridResponse<AdminLogRowDto>(numOfRecords, arr);
    }

    private static async Task<AdminGridResponse<AdminExerciseRowDto>> GetLearningPathExercises(int page, int learningPathId, byte? status, IMemoryCache cache, AyalasLanguageDbContext db)
    {
        var baseQuery = db.Exercises.Where(lp => lp.LearningPathId == learningPathId).AsQueryable();

        if (status != null)
        {
            baseQuery = baseQuery.Where(lp => lp.Status == status);
        }

        var query = baseQuery.Include(e => e.User)
            .Include(e => e.LearningPath)
            .Include(e => e.ExerciseType);

        var arrMapped = await QueryExercises(query, page, status, cache, db);

        int numOfRecords = await baseQuery.CountAsync();
        return new AdminGridResponse<AdminExerciseRowDto>(numOfRecords, arrMapped);
    }
    private static async Task<AdminGridResponse<AdminExerciseRowDto>> GetExercises(int page, byte? status, IMemoryCache cache, AyalasLanguageDbContext db)
    {
        var baseQuery = db.Exercises.AsQueryable();

        if (status != null)
        {
            baseQuery = baseQuery.Where(lp => lp.Status == status);
        }

        var query = baseQuery
            .Include(e => e.User)
            .Include(lp => lp.LearningPath)
            .Include(e => e.ExerciseType);

        var arrMapped = await QueryExercises(query, page, status, cache, db);

        int numOfRecords = await baseQuery.CountAsync();
        return new AdminGridResponse<AdminExerciseRowDto>(numOfRecords, arrMapped);
    }

    private static async Task<AdminExerciseRowDto[]> QueryExercises(IQueryable<Exercise> query, int page, byte? status, IMemoryCache cache, AyalasLanguageDbContext db)
    {
        if (status != null)
        {
            query = query.Where(lp => lp.Status == status);
        }

        var arr = await query.OrderByDescending(e => e.ExerciseId)
            .Select(e => new
            {
                KnownLanguageId = e.LearningPath != null ? e.LearningPath.KnownLanguageId : 0,
                TargetLanguageId = e.LearningPath != null ? e.LearningPath.TargetLanguageId : 0,
                e.UserId,
                UserName = e.User != null ? e.User.UserName : null,
                Name = e.LearningPath != null ? e.LearningPath.Name : null,
                e.Data,
                e.ExerciseTypeId,
                ExerciseType = e.ExerciseType.Name,
                e.CreatedOn,
                e.LearningPathId,
                e.ExerciseId,
                e.Status
            }).Skip(page * Constants.PAGE_SIZE).Take(Constants.PAGE_SIZE + 1).ToArrayAsync();

        Language[]? languages = await db.GetAppDataFromCache(Constants.LANGUAGE_SET_CACHE_KEY, cache,
        async (ctx) => await ctx.Languages.ToArrayAsync());

        return arr.Select(e =>
        {
            string? knownLangName = (e.KnownLanguageId != 0 && languages != null)
               ? languages.FirstOrDefault(l => l.LanguageId == e.KnownLanguageId)?.EnglishName
               : null;

            string? targetLangName = (e.TargetLanguageId != 0 && languages != null)
                ? languages.FirstOrDefault(l => l.LanguageId == e.TargetLanguageId)?.EnglishName
                : null;

            return new AdminExerciseRowDto(
                e.UserId,
                e.UserName,
                knownLangName,
                targetLangName,
                e.Name,
                e.Data,
                e.ExerciseTypeId,
                e.ExerciseType,
                e.CreatedOn,
                e.LearningPathId,
                e.ExerciseId,
                e.Status
            );
        }).ToArray();


    }

    private static async Task<AdminGridResponse<AdminLearningPathRowDto>> GetLearningPaths(int page, byte? status, AyalasLanguageDbContext db)
    {
        var baseQuery = db.LearningPaths.AsQueryable();

        if (status != null)
        {
            baseQuery = baseQuery.Where(lp => lp.Status == status);
        }

        var query = baseQuery.Include(lp => lp.User)
            .Include(lp => lp.KnownLanguage)
            .Include(lp => lp.TargetLanguage);

        var arr = await QueryLearningPaths(query, page, db);

        int numOfRecords = await baseQuery.CountAsync();
        return new AdminGridResponse<AdminLearningPathRowDto>(numOfRecords, arr);
    }

    private static async Task<AdminLearningPathRowDto?> GetSingleLearningPath(int learningPathId, AyalasLanguageDbContext db)
    {
        var query = db.LearningPaths
             .Include(lp => lp.User)
             .Include(lp => lp.KnownLanguage)
             .Include(lp => lp.TargetLanguage)
             .Where(lp => lp.LearningPathId == learningPathId)
             .AsQueryable();


        var arr = await QueryLearningPaths(query, 0, db);

        return arr.FirstOrDefault();
    }

    private static async Task<AdminLearningPathRowDto[]> QueryLearningPaths(IQueryable<LearningPath> query, int page, AyalasLanguageDbContext db)
    {
        var arr = await query.OrderByDescending(e => e.LearningPathId).Select(lp => new
        {
            lp.UserId,
            UserName = lp.User != null ? lp.User.UserName : null,
            KnownLanguage = lp.KnownLanguage != null ? lp.KnownLanguage.EnglishName : null,
            TargetLanguage = lp.TargetLanguage != null ? lp.TargetLanguage.EnglishName : null,
            lp.Name,
            lp.Level,
            lp.Chapter,
            lp.CreatedOn,
            lp.LearningPathId,
            lp.Status
        }).Skip(page * Constants.PAGE_SIZE).Take(Constants.PAGE_SIZE + 1).ToArrayAsync();

        return arr.Select(lp => new AdminLearningPathRowDto(
            lp.UserId,
            lp.UserName,
            lp.KnownLanguage,
            lp.TargetLanguage,
            lp.Name,
            lp.Level,
            lp.Chapter,
            lp.CreatedOn,
            lp.LearningPathId,
            db.Exercises.Count(e => e.LearningPathId == lp.LearningPathId && e.Status != (byte)ContentStatusEnum.Removed),
            lp.Status
        )).ToArray();
    }

    private static async Task<AdminDashboardCountersResponse> GetCountersDashboard(int rangeFilter, AyalasLanguageDbContext db)
    {
        DashboardRangeFilter range = (DashboardRangeFilter)rangeFilter;

        //base queries
        var queryContactUs = db.ContactUs.AsQueryable();
        var queryLogs = db.Logs.AsQueryable();
        var queryLearningPaths = db.LearningPaths.AsQueryable();
        var queryDraftLearningPaths = db.LearningPaths.Where(lp => lp.Status == (byte)ContentStatusEnum.Draft).AsQueryable();
        var queryExercises = db.Exercises.AsQueryable();
        var queryUsers = db.Users.AsQueryable();
        var queryTokens = db.Tokens.AsQueryable();

        if (range != DashboardRangeFilter.AllTime)
        {
            //get start time
            DateTime dtStart = default;
            DateTime dtNow = DateTime.UtcNow;
            switch (range)
            {
                case DashboardRangeFilter.LastDay:
                    dtStart = dtNow.AddHours(-24);
                    break;
                case DashboardRangeFilter.SevenDays:
                    dtStart = dtNow.AddDays(-7);
                    break;
                case DashboardRangeFilter.ThirtyDays:
                    dtStart = dtNow.AddDays(-30);
                    break;
            }

            //add filter to queries
            queryContactUs = queryContactUs.Where(cs => cs.CreatedOn >= dtStart);
            queryLogs = queryLogs.Where(cs => cs.CreatedOn >= dtStart);
            queryLearningPaths = queryLearningPaths.Where(cs => cs.CreatedOn >= dtStart);
            queryDraftLearningPaths = queryDraftLearningPaths.Where(cs => cs.CreatedOn >= dtStart);
            queryExercises = queryExercises.Where(cs => cs.CreatedOn >= dtStart);
            queryUsers = queryUsers.Where(cs => cs.CreatedOn >= dtStart);
            queryTokens = queryTokens.Where(cs => cs.CreatedOn >= dtStart);
        }

        int totalContactUs = await queryContactUs.CountAsync();
        int totalLogs = await queryLogs.CountAsync();
        int totalLearningPaths = await queryLearningPaths.CountAsync();
        int totalDraftLearningPaths = await queryDraftLearningPaths.CountAsync();
        int totalExercises = await queryExercises.CountAsync();
        int totalUsers = await queryUsers.CountAsync();
        int totalTokens = await queryTokens.CountAsync();

        return new AdminDashboardCountersResponse(totalContactUs,
            totalLogs, totalLearningPaths, totalDraftLearningPaths, totalExercises,
            totalUsers, totalTokens);
    }


    private static async Task<IResult> SetLearningPathStatus(AdminSetLearningPathStatusRequest req, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();

        var path = await db.LearningPaths.FirstOrDefaultAsync(lp => lp.LearningPathId == req.LearningPathId);
        if (path == null)
        {
            return Results.BadRequest("Lesson not found.");
        }
        path.Status = (byte)req.Status;
        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> MultiSetLearningPathStatus(AdminMultiSetLearningPathStatusRequest req, AyalasLanguageDbContext db)
    {
        foreach (int learningPathId in req.LearningPathIds)
        {
            var path = await db.LearningPaths.FirstOrDefaultAsync(lp => lp.LearningPathId == learningPathId);
            if (path == null)
            {
                return Results.BadRequest($"Lesson {learningPathId} not found.");
            }
            path.Status = (byte)req.Status;
        }
        //only saves if all found
        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> SetExerciseStatus(AdminSetExerciseStatusRequest req, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();

        var exercise = await db.Exercises.FirstOrDefaultAsync(e => e.ExerciseId == req.ExerciseId);
        if (exercise == null)
        {
            return Results.BadRequest("Exercise not found.");
        }
        exercise.Status = (byte)req.Status;
        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> MultiSetExerciseStatus(AdminMultiSetExerciseStatusRequest req, AyalasLanguageDbContext db)
    {
        foreach (int ExerciseId in req.ExerciseIds)
        {
            var exercise = await db.Exercises.FirstOrDefaultAsync(e => e.ExerciseId == ExerciseId);
            if (exercise == null)
            {
                return Results.BadRequest("Exercise not found.");
            }
            exercise.Status = (byte)req.Status;
        }

        //only saves if all found
        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> SetUserRole(AdminSetUserRoleRequest req, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
        var userId = claim.GetUserId();
        if (userId == req.UserId)
        {
            return Results.Conflict("Cannot change own role.");
        }
        var user = await db.Users.FindAsync(req.UserId);
        if (user == null) return Results.BadRequest("User not found.");

        user.Role = req.Role;
        await db.SaveChangesAsync();
        return Results.Ok();
    }
}
