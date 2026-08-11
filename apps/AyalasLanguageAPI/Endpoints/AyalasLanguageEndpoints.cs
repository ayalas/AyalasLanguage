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
    using AyalasLanguageAPI.Endpoints.AIIntegration;
    using AyalasLanguageAPI.Endpoints.Inbox;

    public static class AyalasLanguageEndpoints
    {
        public static void MapAyalasLanguageEndpoints(this IEndpointRouteBuilder app)
        {
            // Register User APIs for the Web Frontend
            app.RegisterUserRoutes("/api");

            // Register EXACT SAME APIs for the Mobile Frontend
            app.RegisterUserRoutes("/mobile/api");

            //admin endpoints
            app.MapAdminEndpoints();

            // Fallback for any unmatched API calls
            app.Map("/api/{**slug}", (string? slug) => Results.NotFound());
            app.Map("/mobile/api/{**slug}", (string? slug) => Results.NotFound());
        }

        private static void RegisterUserRoutes(this IEndpointRouteBuilder app, string prefix)
        {
            // Pass the prefix down to each sub-module
            app.MapAuthEndpoints(prefix);
            app.MapProfileEndpoints(prefix);
            app.MapLearningEndpoints(prefix);
            app.MapContentCreatorEndpoints(prefix);
            app.MapPublicEndpoints(prefix);
            app.MapAIIntegrationEndpoints(prefix);
            app.MapStaticEndpoints(prefix);
            app.MapInboxEndpoints(prefix);
        }

    }

}