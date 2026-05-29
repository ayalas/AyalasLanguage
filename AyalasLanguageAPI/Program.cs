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


if (!app.Environment.IsDevelopment())
{
    var contentRoot = builder.Environment.ContentRootPath;
    var distPath = Path.Combine(contentRoot, "dist");

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

app.Run();
