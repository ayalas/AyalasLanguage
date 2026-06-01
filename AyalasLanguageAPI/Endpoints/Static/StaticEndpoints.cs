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
        var staticData = app.MapGroup("/api/static").WithTags("Static");

        staticData.MapGet("/languages", GetLanguages);
    }

    public static void ServeStaticFiles(this WebApplication app, string rootPath)
    {

        var distPath = Path.Combine(rootPath, "dist");

        // Fallback check if running inside a containerized production environment
        if (!Directory.Exists(distPath))
        {
            distPath = Path.Combine(AppContext.BaseDirectory, "dist");
        }

        app.UseDefaultFiles(new DefaultFilesOptions
        {
            FileProvider = new PhysicalFileProvider(distPath),
            RequestPath = ""
        });

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(distPath),
            RequestPath = ""
        });
    }

    [Authorize]
    private static async Task<IResult> GetLanguages(AyalasLanguageDbContext db)
    {
        var languages = await db.Languages
            .OrderBy(l => l.EnglishName)
            .Select(l => new LanguageDto(l.LanguageId, l.Code, l.EnglishName, l.NativeName))
            .ToListAsync();

        return Results.Ok(languages);
    }
}
