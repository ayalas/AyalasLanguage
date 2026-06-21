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
        var staticData = app.MapGroup("/api/static")
            .AddEndpointFilter<ErrorLoggingFilter>().WithTags("Static")
            .RequireAuthorization(new AuthorizeAttribute
            {
                AuthenticationSchemes = "PublicAuth"
            });

        staticData.MapGet("/languages", GetLanguages);
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
