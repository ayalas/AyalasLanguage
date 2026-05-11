using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Endpoints;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddAyalasLanguageDb();

var app = builder.Build();

app.MapLanguageEndpoints();
app.MapContentCreatorEndpoints();

app.MigrateDb();

app.Run();
