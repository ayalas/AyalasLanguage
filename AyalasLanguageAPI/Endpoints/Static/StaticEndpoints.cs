using System;
using System.Security.Claims;
using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageAPI.Endpoints.Static;

public static class StaticEndpoints
{
    public static void MapStaticEndpoints(this IEndpointRouteBuilder app)
    {
        var staticData = app.MapGroup("/api/static").WithTags("Static");

        staticData.MapGet("/languages", GetLanguages);
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
