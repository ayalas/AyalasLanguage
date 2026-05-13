using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Endpoints;
using AyalasLanguageAPI.Model;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

var builder = WebApplication.CreateBuilder(args);

builder.AddAyalasLanguageDb();

builder.Services.AddMemoryCache();

builder.Services.AddAuthentication("CacheAuth")
    .AddScheme<AuthenticationSchemeOptions, CacheAuthHandler>("CacheAuth", null);

builder.Services.AddAuthorization();

var app = builder.Build();

app.MigrateDb();

app.UseAuthentication(); // Must come before UseAuthorization
app.UseAuthorization();

app.MapAyalasLanguageEndpoints();

app.Run();
