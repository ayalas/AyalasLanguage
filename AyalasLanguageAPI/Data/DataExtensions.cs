using System;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageAPI.Data;

public static class DataExtensions
{
    public static void MigrateDb(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AyalasLanguageDbContext>();
        context.Database.Migrate();
    }

    public static void AddAyalasLanguageDb(this WebApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
        builder.Services.AddSqlite<AyalasLanguageDbContext>(connectionString);
    }
}
