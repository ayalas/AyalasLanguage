using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Endpoints;
using AyalasLanguageAPI.Endpoints.Static;
using AyalasLanguageAPI.Data.Model;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using AyalasLanguageAPI.Routing;

var builder = WebApplication.CreateBuilder(args);

builder.AddAyalasLanguageDb();

builder.Services.AddMemoryCache();

builder.AddAuthenticationSchemes();

builder.Services.AddAuthorization();

builder.AddRouteConstraints();

builder.AddCorsSettings();

var app = builder.Build();

app.MigrateDb();

await app.MakeFirstUserAdmin();

//support forward headers for reverse proxy scenarios (e.g., when deployed behind Nginx or Apache)
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor |
                       Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});

app.UseWebSockets();


if (app.Environment.IsDevelopment())
{
    app.UseCors();
}

app.UseAuthentication(); // Must come before UseAuthorization
app.UseAuthorization();

app.RedirectToAdminRoot(); //redirects /admin to /admin/ when serving static files

app.MapAyalasLanguageEndpoints();

if (!app.Environment.IsDevelopment())
{
    app.ServeStaticFiles(builder.Environment.ContentRootPath, builder.Configuration);
}

app.Run();
