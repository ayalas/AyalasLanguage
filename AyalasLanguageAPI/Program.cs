using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Endpoints;
using AyalasLanguageAPI.Endpoints.Static;
using AyalasLanguageAPI.Data.Model;
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

//support forward headers for reverse proxy scenarios (e.g., when deployed behind Nginx or Apache)
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | 
                       Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});

app.UseAuthentication(); // Must come before UseAuthorization
app.UseAuthorization();

app.MapAyalasLanguageEndpoints();

if (!app.Environment.IsDevelopment())
{
    app.ServeStaticFiles(builder.Environment.ContentRootPath);
}

app.Run();
