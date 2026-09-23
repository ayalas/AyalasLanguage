using System;
using System.Security.Claims;
using System.Security.Cryptography;
using AyalasLanguageAPI.AdminDTOs;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

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
        secureAuth.MapGet("/user/{userId:int}", GetUser);
        secureAuth.MapGet("/users/{page:int}", GetUsers);
        secureAuth.MapGet("/logins/{page:int}", GetLogins);
        secureAuth.MapPost("/setuserrole", SetUserRole);

        var adminAPIsecured = app.MapGroup("/admin/api").AddEndpointFilter<ErrorLoggingFilter>().WithTags("AdminAPI")
            .RequireAuthorization(new AuthorizeAttribute
            {
                AuthenticationSchemes = "AdminAuth",
                Roles = "Admin"
            });

        adminAPIsecured.MapGet("/contactus/{page:int}", GetContactUsRecords);
        adminAPIsecured.MapGet("/logs/{page:int}", GetLogsRecords);
        adminAPIsecured.MapGet("/jobs/{page:int}", GetJobsRecords);
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

    private static async Task<IResult> LogoutUser(ClaimsPrincipal claim, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context)
    {
        var userId = claim.GetUserId();

        // Evict specific cookie token from memory cache if present
        string? rawToken = context.Request.Cookies[Constants.ADMIN_APP_COOKIE_NAME];
        if (!string.IsNullOrEmpty(rawToken))
        {
            string tokenHash = TokenGenerator.HashToken(rawToken);
            cache.Remove($"sess:{AppIdEnum.Admin}:{tokenHash}");
        }

        // Invalidate all active Admin tokens for this user in DB
        await db.Tokens
            .Where(t => t.UserId == userId && (t.AppId == (byte)AppIdEnum.Admin || t.AppId == (byte)AppIdEnum.Admin2FA))
            .ExecuteDeleteAsync();

        context.Response.Cookies.Delete(Constants.ADMIN_APP_COOKIE_NAME);

        return Results.NoContent();
    }

    private static async Task<IResult> LoginUser(AdminLoginDto login, IConfiguration config, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context, ILogger<Program> logger)
    {
        if (!CacheUtils.ProtectByCacheCount(Constants.ADMIN_LOGIN_COUNT_CACHE_KEY, cache, Constants.MAX_ADMIN_LOGIN_PER_PERIOD))
        {
            return Results.Conflict("The system cannot accept new logins at this time. Please try again later.");
        }

        // Query user with AsNoTracking
        User? user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserName == login.UserName && u.Role == (int)UserRoleEnum.Admin);

        if (user == null || !BCrypt.Net.BCrypt.Verify(login.Password, user.PasswordHash))
            return Results.Conflict("Invalid credentials. Please try again with your correct email and password.");

        CacheUtils.AddToCountProtection(Constants.ADMIN_LOGIN_COUNT_CACHE_KEY, cache, Constants.CACHE_PROTECTION_MINUTES);

        if (user.EmailConfirmed && user.Use2FALogin)
        {
            // Cryptographically secure random 6-digit code
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
                AppId = (byte)AppIdEnum.Admin2FA
            };
            db.Tokens.Add(tokenEntry);
            await db.SaveChangesAsync();

            // Cache compact session record with bounded size
            var session = new CachedUserSession(user.UserId, user.UserName, user.Role, expires);
            cache.Set($"sess:{AppIdEnum.Admin2FA}:{tokenHash}", session, new MemoryCacheEntryOptions
            {
                AbsoluteExpiration = expires,
                Size = 1
            });

            string emailTitle = $"{Constants.BRAND_NAME}: your two factor authentication code";
            string emailContent = $"<p>{code} is your two factor authentication code.</p>";

            await Utils.Utils.SendEmail(user.UserName, emailTitle, emailContent, config, logger);

            return Results.Ok(new AdminLoginResponseDto(expires, null, true, tokenStart));
        }
        else
        {
            return await FinalizeLogin(user.UserId, user.UserName, user.Role, config, db, cache, context);
        }
    }

    private static async Task<IResult> Verify2FA(AdminVerify2FARequest req, IConfiguration config, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context)
    {
        if (!CacheUtils.ProtectByCacheCount(req.Verify2FAToken, cache, Constants.VERIFY2FA_TOKEN_MAX_RETRY))
        {
            return Results.Conflict("Too many entry attempts for two factor authentication code. Please restart the login process.");
        }

        string rawToken = $"{req.Verify2FAToken}{req.Code}";
        string tokenHash = TokenGenerator.HashToken(rawToken);
        string cacheKey = $"sess:{AppIdEnum.Admin2FA}:{tokenHash}";
        DateTime now = DateTime.UtcNow;

        CachedUserSession? session;
        if (!cache.TryGetValue(cacheKey, out session) || session == null)
        {
            var tokenRecord = await db.Tokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.AppId == (byte)AppIdEnum.Admin2FA);

            if (tokenRecord != null && tokenRecord.ExpiresOn >= now && tokenRecord.User.Role == (byte)UserRoleEnum.Admin)
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
                    && t.AppId == (byte)AppIdEnum.Admin2FA
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
        return Results.Conflict("Expired or invalid two factor authentication code. Please try again or restart the login process.");
    }

    private static async Task<IResult> FinalizeLogin(int userId, string userName, byte role, IConfiguration config, AyalasLanguageDbContext db, IMemoryCache cache, HttpContext context)
    {
        string rawToken = TokenGenerator.GenerateToken();
        string tokenHash = TokenGenerator.HashToken(rawToken);
        var expires = DateTime.UtcNow.AddHours(config.GetValue<int>("Session:AdminTokenExpirationHours", 12));

        var tokenEntry = new Token
        {
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresOn = expires,
            AppId = (byte)AppIdEnum.Admin,
            UserAgent = context.Request.Headers.UserAgent.ToString()
        };

        AdminUserIdDto? userIdDto = await GetUserById(userId, db);
        if (userIdDto == null) return Results.InternalServerError("Could not retrieve user");

        db.Tokens.Add(tokenEntry);
        await db.SaveChangesAsync();

        // Cache lightweight session representation with explicit size
        var session = new CachedUserSession(userId, userName, role, expires);
        cache.Set($"sess:{AppIdEnum.Admin}:{tokenHash}", session, new MemoryCacheEntryOptions
        {
            AbsoluteExpiration = expires,
            Size = 1
        });

        // Preserved Secure = true and IsEssential = true
        context.Response.Cookies.Append(Constants.ADMIN_APP_COOKIE_NAME, rawToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = new DateTimeOffset(expires),
            IsEssential = true
        });

        return Results.Ok(new AdminLoginResponseDto(expires, userIdDto, false, null));
    }

    private static async Task<AdminUserIdDto?> GetUserById(int userId, AyalasLanguageDbContext db)
    {
        return await db.Users
            .AsNoTracking()
            .Where(u => u.UserId == userId && u.Role == (int)UserRoleEnum.Admin)
            .Select(u => new AdminUserIdDto(u.UserId, u.DisplayName, u.UserName, u.Role, u.EmailConfirmed, u.Use2FALogin))
            .FirstOrDefaultAsync();
    }
    
    private static async Task<PagedResponse<AdminUserRowDto>> GetUsers(int page, AyalasLanguageDbContext db)
    {
        var arr = await db.Users
            .AsNoTracking()
            .Select(u => new AdminUserRowDto(
                u.UserId,
                u.DisplayName,
                u.UserName,
                u.Role,
                u.EmailConfirmed,
                u.Use2FALogin,
                u.ShowOnlyPrivateContent,
                u.KnownLanguage == null ? null : u.KnownLanguage.EnglishName,
                u.TargetLanguage == null ? null : u.TargetLanguage.EnglishName,
                u.CreatedOn
            ))
            .Skip(page * Constants.ADMIN_PAGE_SIZE)
            .Take(Constants.ADMIN_PAGE_SIZE + 1)
            .ToArrayAsync();

        int numOfRecords = 0;
        if (page == 0)
            numOfRecords = await db.Users.CountAsync();
        return new PagedResponse<AdminUserRowDto>(numOfRecords, arr);
    }

    private static async Task<AdminUserDetailsDto?> GetUser(int userId, AyalasLanguageDbContext db)
    {
        return await db.Users
            .AsNoTracking()
            .Where(u => u.UserId == userId)
            .Select(u => new AdminUserDetailsDto(
                u.UserId,
                u.DisplayName,
                u.UserName,
                u.Role,
                u.EmailConfirmed,
                u.Use2FALogin,
                u.KnownLanguage == null ? null : u.KnownLanguage.EnglishName,
                u.TargetLanguage == null ? null : u.TargetLanguage.EnglishName,
                u.CreatedOn,
                u.DisableAutoAI,
                u.ShowOnlyPrivateContent,
                u.NumOfExercisesToGenerate,
                u.ForgotEmailSent,
                u.ForgotEmailReceived, 
                u.EmailConfirmationReceived,
                u.ConfirmationEmailSent
            ))
            .FirstOrDefaultAsync();
    }

    private static async Task<PagedResponse<AdminContactUsRowDto>?> GetContactUsRecords(int page, AyalasLanguageDbContext db, ILogger<Program> logger)
    {
        var arr = await db.ContactUs
            .AsNoTracking()
            .OrderByDescending(c => c.ContactUsId)
            .Select(c => new AdminContactUsRowDto(
                c.ContactUsId,
                c.UserId,
                c.User != null ? c.User.DisplayName : null,
                c.Email,
                c.Message,
                c.CreatedOn
            ))
            .Skip(page * Constants.ADMIN_PAGE_SIZE)
            .Take(Constants.ADMIN_PAGE_SIZE + 1)
            .ToArrayAsync();

        int numOfRecords = 0;
        if (page == 0)
            numOfRecords = await db.ContactUs.CountAsync();
        return new PagedResponse<AdminContactUsRowDto>(numOfRecords, arr);
    }

    private static async Task<PagedResponse<AdminLogRowDto>> GetLogsRecords(int page, IMemoryCache cache, AyalasLanguageDbContext db)
    {
        var arr = await db.Logs
            .AsNoTracking()
            .OrderByDescending(l => l.LogId)
            .Select(l => new AdminLogRowDto(
                l.LogId,
                l.UserId,
                l.User != null ? l.User.UserName : null,
                (LogTypeEnum)l.LogType,
                l.Description,
                l.CreatedOn
            ))
            .Skip(page * Constants.ADMIN_PAGE_SIZE)
            .Take(Constants.ADMIN_PAGE_SIZE + 1)
            .ToArrayAsync();

        int numOfRecords = 0;
        if (page == 0)
            numOfRecords = await db.Logs.CountAsync();
        return new PagedResponse<AdminLogRowDto>(numOfRecords, arr);
    }

    private static async Task<PagedResponse<AdminJobRowDto>> GetJobsRecords(int page, int? filter, IMemoryCache cache, AyalasLanguageDbContext db)
    {
        JobFilter jobFilter = filter == null ? JobFilter.All : (JobFilter)filter;

        var baseQuery = db.Jobs.AsNoTracking();

        if (jobFilter == JobFilter.Completed)
        {
            baseQuery = baseQuery.Where(j => j.JobStatus == (byte)JobStatusEnum.Completed);
        }
        else if (jobFilter != JobFilter.All)
        {
            var (failedJobStatuses, incompleteJobStatuses) = GetJobStatusesForFilters();
            if (jobFilter == JobFilter.Failed)
            {
                baseQuery = baseQuery.Where(j => failedJobStatuses.Contains(j.JobStatus));
            }
            else
            {
                baseQuery = baseQuery.Where(j => incompleteJobStatuses.Contains(j.JobStatus));
            }
        }

        var arr = await baseQuery
            .OrderByDescending(l => l.JobId)
            .Select(l => new AdminJobRowDto(
                l.JobId,
                l.MainRecordId,
                l.SecondaryRecordId,
                l.ExtraData,
                (JobTypeEnum)l.JobType,
                (JobStatusEnum)l.JobStatus,
                l.CreatedOn,
                l.ModifiedOn,
                l.FirstError,
                l.Completed,
                l.Errors,
                l.LeftToProcess
            ))
            .Skip(page * Constants.ADMIN_PAGE_SIZE)
            .Take(Constants.ADMIN_PAGE_SIZE + 1)
            .ToArrayAsync();

        int numOfRecords = 0;
        if (page == 0)
            numOfRecords = await db.Jobs.CountAsync();
        return new PagedResponse<AdminJobRowDto>(numOfRecords, arr);
    }

    private static async Task<PagedResponse<AdminExerciseRowDto>> GetLearningPathExercises(int page, int learningPathId, byte? status, IMemoryCache cache, AyalasLanguageDbContext db)
    {
        var baseQuery = db.Exercises.AsNoTracking().Where(lp => lp.LearningPathId == learningPathId);

        if (status != null)
        {
            baseQuery = baseQuery.Where(lp => lp.Status == status);
        }

        var arrMapped = await QueryExercises(baseQuery, page, status, cache, db);

        int numOfRecords = await baseQuery.CountAsync();
        return new PagedResponse<AdminExerciseRowDto>(numOfRecords, arrMapped);
    }

    private static async Task<PagedResponse<AdminExerciseRowDto>> GetExercises(int page, byte? status, IMemoryCache cache, AyalasLanguageDbContext db)
    {
        var baseQuery = db.Exercises.AsNoTracking();

        if (status != null)
        {
            baseQuery = baseQuery.Where(lp => lp.Status == status);
        }

        var arrMapped = await QueryExercises(baseQuery, page, status, cache, db);

        int numOfRecords = await baseQuery.CountAsync();
        return new PagedResponse<AdminExerciseRowDto>(numOfRecords, arrMapped);
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
                e.Status,
                e.OwnershipType
            })
            .Skip(page * Constants.ADMIN_PAGE_SIZE)
            .Take(Constants.ADMIN_PAGE_SIZE + 1)
            .ToArrayAsync();

        Language[]? languages = await db.GetAppDataFromCache(Constants.LANGUAGE_SET_CACHE_KEY, cache,
            async (ctx) => await ctx.Languages.AsNoTracking().ToArrayAsync());

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
                e.Status,
                e.OwnershipType
            );
        }).ToArray();
    }

    private static async Task<PagedResponse<AdminLearningPathRowDto>> GetLearningPaths(int page, byte? status, AyalasLanguageDbContext db)
    {
        var baseQuery = db.LearningPaths.AsNoTracking();

        if (status != null)
        {
            baseQuery = baseQuery.Where(lp => lp.Status == status);
        }

        var arr = await QueryLearningPaths(baseQuery, page, db);

        int numOfRecords = await baseQuery.CountAsync();
        return new PagedResponse<AdminLearningPathRowDto>(numOfRecords, arr);
    }

    public static async Task<PagedResponse<AdminLoginRowDto>> GetLogins(int page, AyalasLanguageDbContext db)
    {
        var baseQuery = db.Tokens.AsNoTracking();
        var arr = await baseQuery.OrderByDescending(e => e.TokenId)
            .Select(e => new AdminLoginRowDto( 
                e.UserId,
                e.User != null ? e.User.UserName : null,
                e.AppId,
                e.CreatedOn,
                e.ExpiresOn,
                e.LastUsedAt
            ))
            .Skip(page * Constants.ADMIN_PAGE_SIZE)
            .Take(Constants.ADMIN_PAGE_SIZE + 1)
            .ToArrayAsync();

        int numOfRecords = await baseQuery.CountAsync();
        return new PagedResponse<AdminLoginRowDto>(numOfRecords, arr);
    }

    private static async Task<AdminLearningPathRowDto?> GetSingleLearningPath(int learningPathId, AyalasLanguageDbContext db)
    {
        var query = db.LearningPaths
            .AsNoTracking()
            .Where(lp => lp.LearningPathId == learningPathId);

        var arr = await QueryLearningPaths(query, 0, db);
        return arr.FirstOrDefault();
    }

    private static async Task<AdminLearningPathRowDto[]> QueryLearningPaths(IQueryable<LearningPath> query, int page, AyalasLanguageDbContext db)
    {
        var arr = await query.OrderByDescending(e => e.LearningPathId)
            .Select(lp => new
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
                lp.Status,
                lp.OwnershipType
            })
            .Skip(page * Constants.ADMIN_PAGE_SIZE)
            .Take(Constants.ADMIN_PAGE_SIZE + 1)
            .ToArrayAsync();

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
            lp.Status,
            lp.OwnershipType
        )).ToArray();
    }

    private static async Task<AdminDashboardCountersResponse> GetCountersDashboard(int rangeFilter, AyalasLanguageDbContext db)
    {
        DashboardRangeFilter range = (DashboardRangeFilter)rangeFilter;
        var (failedJobStatuses, incompleteJobStatuses) = GetJobStatusesForFilters();

        var queryContactUs = db.ContactUs.AsNoTracking();
        var queryLogs = db.Logs.AsNoTracking();
        var queryIncompleteJobs = db.Jobs.AsNoTracking().Where(j => incompleteJobStatuses.Contains(j.JobStatus));
        var queryFailedJobs = db.Jobs.AsNoTracking().Where(j => failedJobStatuses.Contains(j.JobStatus));
        var queryLearningPaths = db.LearningPaths.AsNoTracking();
        var queryDraftLearningPaths = db.LearningPaths.AsNoTracking().Where(lp => lp.Status == (byte)ContentStatusEnum.Draft);
        var queryExercises = db.Exercises.AsNoTracking();
        var queryUsers = db.Users.AsNoTracking();
        var queryTokens = db.Tokens.AsNoTracking().Where(t => t.AppId == (byte)AppIdEnum.Main || t.AppId == (byte)AppIdEnum.Admin);

        if (range != DashboardRangeFilter.AllTime)
        {
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

            queryContactUs = queryContactUs.Where(cs => cs.CreatedOn >= dtStart);
            queryLogs = queryLogs.Where(cs => cs.CreatedOn >= dtStart);
            queryIncompleteJobs = queryIncompleteJobs.Where(cs => cs.CreatedOn >= dtStart);
            queryFailedJobs = queryFailedJobs.Where(cs => cs.CreatedOn >= dtStart);
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
        int totalIncompleteJobs = await queryIncompleteJobs.CountAsync();
        int totalFailedJobs = await queryFailedJobs.CountAsync();

        return new AdminDashboardCountersResponse(
            totalContactUs,
            totalLogs, 
            totalLearningPaths, 
            totalDraftLearningPaths, 
            totalExercises,
            totalUsers, 
            totalTokens, 
            totalIncompleteJobs, 
            totalFailedJobs);
    }

    private static async Task<IResult> SetLearningPathStatus(AdminSetLearningPathStatusRequest req, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
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

        await db.SaveChangesAsync();
        return Results.Ok();
    }

    private static async Task<IResult> SetExerciseStatus(AdminSetExerciseStatusRequest req, ClaimsPrincipal claim, AyalasLanguageDbContext db)
    {
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
        foreach (int exerciseId in req.ExerciseIds)
        {
            var exercise = await db.Exercises.FirstOrDefaultAsync(e => e.ExerciseId == exerciseId);
            if (exercise == null)
            {
                return Results.BadRequest("Exercise not found.");
            }
            exercise.Status = (byte)req.Status;
        }

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

    private static (byte[] failedJobStatuses, byte[] incompleteJobStatuses) GetJobStatusesForFilters()
    {
        return (new byte[] { 
            (byte)JobStatusEnum.PartiallyFailed, 
            (byte)JobStatusEnum.Failed
        }, new byte[] { 
            (byte)JobStatusEnum.NotStarted, 
            (byte)JobStatusEnum.Running, 
            (byte)JobStatusEnum.Stopped 
        });
    }
}