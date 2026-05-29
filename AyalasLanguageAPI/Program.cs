using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Endpoints;
using AyalasLanguageAPI.Model;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

builder.AddAyalasLanguageDb();

builder.Services.AddMemoryCache();

builder.Services.AddAuthentication("CacheAuth")
    .AddScheme<AuthenticationSchemeOptions, CacheAuthHandler>("CacheAuth", null);

builder.Services.AddAuthorization();

var app = builder.Build();

app.MigrateDb();

app.FromCookieToAuthHeader(builder.Configuration);
app.UseAuthentication(); // Must come before UseAuthorization
app.UseAuthorization();

app.MapAyalasLanguageEndpoints();

if (builder.Configuration["ASPNETCORE_ENVIRONMENT"]  != "Development")
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(
            Path.Combine(builder.Environment.ContentRootPath, "dist")),
        RequestPath = "" // serve the static files in the root. APIS are served in /api
    });
}

app.Run();
