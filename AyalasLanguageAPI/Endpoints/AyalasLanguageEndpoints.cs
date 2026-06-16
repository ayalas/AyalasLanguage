using System;
using BCrypt.Net;

namespace AyalasLanguageAPI.Endpoints
{
    using AyalasLanguageAPI.DTOs;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.AspNetCore.Builder;
    using Microsoft.AspNetCore.Http;
    using Microsoft.AspNetCore.Routing;
    using AyalasLanguageAPI.Data;
    using AyalasLanguageAPI.Data.Model;
    using Microsoft.Extensions.Caching.Memory;
    using System.Security.Claims;
    using AyalasLanguageAPI.Auth;
    using Microsoft.AspNetCore.Authorization;
    using AyalasLanguageAPI.Endpoints.Learning;
    using AyalasLanguageAPI.Endpoints.Profile;
    using AyalasLanguageAPI.Endpoints.Static;

    public static class AyalasLanguageEndpoints
    {
        public static void MapAyalasLanguageEndpoints(this IEndpointRouteBuilder app)
        {
            app.MapAuthEndpoints(); // Register, change password, login, logout

            // Protected endpoints (requires authentication)
            app.MapProfileEndpoints(); //edit profile, get profile, switch language
            app.MapLearningEndpoints(); // get learning path, update progress, get exercises
            app.MapContentCreatorEndpoints(); // add exercises and learning paths
            app.MapStaticEndpoints(); // get all languages
            app.MapPublicEndpoints();
            //falback all apis
            app.Map("/api/{**slug}", (string? slug) =>
            {
                return Results.NotFound();
            });
        }

    }

}