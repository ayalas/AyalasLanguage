using AyalasLanguageAPI.Auth;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Endpoints;
using AyalasLanguageAPI.Routing;
using AyalasLanguageAPI.Jobs;

var builder = WebApplication.CreateBuilder(args);

//add services
builder.AddAyalasLanguageDb();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient(); 
builder.AddAuthenticationSchemes();
builder.Services.AddAuthorization();
builder.AddJobServices();
builder.AddRouteConstraints();
builder.AddCorsSettings();

var app = builder.Build();

app.MigrateDb();

await app.MakeFirstUserAdmin();

app.SetForwardOptions();

app.UseWebSockets();


if (app.Environment.IsDevelopment())
{
    app.UseCors();
}

app.UseAuthentication(); // Must come before UseAuthorization
app.UseAuthorization();

app.RedirectToSubApps(); //redirects /admin to /admin/ and /mobile to /mobile/ when serving static files

app.MapAyalasLanguageEndpoints();

if (!app.Environment.IsDevelopment())
{
    app.ServeStaticFiles(builder.Environment.ContentRootPath, builder.Configuration);
}

app.UseJobScheduler();

app.Run();
