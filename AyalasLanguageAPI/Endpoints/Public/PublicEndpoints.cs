using System;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using AyalasLanguageAPI.DTOs;
using AyalasLanguageAPI.Utils;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace AyalasLanguageAPI.Endpoints;

public static class PublicEndpoints
{
    public static void MapPublicEndpoints(this IEndpointRouteBuilder app)
    {
        var publicEndpoints = app.MapGroup("/api/public").WithTags("Public");

        publicEndpoints.MapPost("/message", CreatePublicContactUs);
    }

    private static async Task<IResult> CreatePublicContactUs(ContactUsPublicDto dto, IMemoryCache cache, AyalasLanguageDbContext db)
    {
        if (dto.Message.Length > Constants.MAX_MESSAGE_PUBLIC_CONTACT_US)
        {
            return Results.BadRequest($"Message must not exceed {Constants.MAX_MESSAGE_PUBLIC_CONTACT_US} characters");
        }

        if (!CacheUtils.ProtectByCacheCount(Constants.CONTACT_US_COUNT_CACHE_KEY, cache, Constants.MAX_CONTACT_US_PER_PERIOD))
        {
            return Results.Conflict("The system cannot accept your message at this time. Please try again later.");
        }

        ContactUs rec = new()
        {
            Email = dto.Email,
            Message = dto.Message
        };
        db.ContactUs.Add(rec);
        await db.SaveChangesAsync();

        CacheUtils.AddToCountProtection(Constants.CONTACT_US_COUNT_CACHE_KEY, cache, Constants.CONTACT_US_CACHE_PROTECTION_MINUTES);

        return Results.Ok();
    }
}
