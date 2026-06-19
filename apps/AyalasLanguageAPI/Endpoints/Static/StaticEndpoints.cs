using System;
using System.Security.Claims;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Data.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

namespace AyalasLanguageAPI.Endpoints.Static;

public static class StaticEndpoints
{
    public static void MapStaticEndpoints(this IEndpointRouteBuilder app)
    {
        var staticData = app.MapGroup("/api/static").WithTags("Static")
            .RequireAuthorization(new AuthorizeAttribute
                {
                    AuthenticationSchemes = "PublicAuth"
                });

        staticData.MapGet("/languages", GetLanguages);
    }

    public static void ServeStaticFiles(this WebApplication app, string rootPath, IConfiguration config)
    {
        var publicFileProvider = GetFileProvider(config, rootPath, "FrontendsPhysicalFolders:public", app.Logger);
        var adminFileProvider = GetFileProvider(config, rootPath, "FrontendsPhysicalFolders:admin", app.Logger);

        StaticFileOptions? publicStaticFileOptions = null;
        StaticFileOptions? adminStaticFileOptions = null;

        if (adminFileProvider != null)
        {
            app.UseDefaultFiles(new DefaultFilesOptions
            {
                FileProvider = adminFileProvider,
                RequestPath = "/admin"
            });

            adminStaticFileOptions = new StaticFileOptions
            {
                FileProvider = adminFileProvider,
                RequestPath = "/admin"
            };

            app.UseStaticFiles(adminStaticFileOptions);

            app.MapFallbackToFile("/admin/{*path:nonfile}", "index.html", adminStaticFileOptions);
        }

        if (publicFileProvider != null)
        {
            app.UseDefaultFiles(new DefaultFilesOptions
            {
                FileProvider = publicFileProvider,
                RequestPath = ""
            });

            publicStaticFileOptions = new StaticFileOptions
            {
                FileProvider = publicFileProvider,
                RequestPath = ""
            };

            app.UseStaticFiles(publicStaticFileOptions);

            app.MapFallbackToFile("index.html", publicStaticFileOptions);
        }
    }

    private static PhysicalFileProvider? GetFileProvider(IConfiguration config, string rootPath, string configKey, ILogger logger)
    {
        var relAppPath = config.GetValue<string>(configKey);
        if (relAppPath == null)
        {
            logger.LogWarning($"GetFileProvider for {configKey}: missing configuration value");
            return null;
        }
        var appPath = Path.Combine(rootPath, relAppPath);

        // Fallback check if running inside a containerized production environment
        if (!Directory.Exists(appPath))
        {
            logger.LogWarning($"GetFileProvider for {configKey}: {appPath} path does not exist. Attempting to create {relAppPath} in {AppContext.BaseDirectory}");
            appPath = Path.Combine(AppContext.BaseDirectory, relAppPath);
        }

        return new PhysicalFileProvider(appPath);
    }

    private static async Task<IResult> GetLanguages(AyalasLanguageDbContext db)
    {
        var languages = await db.Languages
            .OrderBy(l => l.EnglishName)
            .Select(l => new LanguageDto(l.LanguageId, l.Code, l.EnglishName, l.NativeName))
            .ToListAsync();

        return Results.Ok(languages);
    }
}
