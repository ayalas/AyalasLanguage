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
        // 1. Attempt to read AWS RDS environment variables
        var rdsHost = Environment.GetEnvironmentVariable("RDS_HOSTNAME");
        string? connectionString = null;

        if (!string.IsNullOrEmpty(rdsHost))
        {
            // We are running in AWS Beanstalk! Build the MySQL connection string dynamically.
            var rdsPort = Environment.GetEnvironmentVariable("RDS_PORT") ?? "3306";
            var rdsUser = Environment.GetEnvironmentVariable("RDS_USERNAME");
            var rdsPass = Environment.GetEnvironmentVariable("RDS_PASSWORD");
            var rdsDb = Environment.GetEnvironmentVariable("RDS_DB_NAME");

            connectionString = $"Server={rdsHost};Port={rdsPort};Database={rdsDb};Uid={rdsUser};Pwd={rdsPass};";

            // ServerVersion.AutoDetect automatically figures out the MySQL/MariaDB version from RDS
            builder.Services.AddDbContext<AyalasLanguageDbContext>(options =>
                options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
        }
        else
        {
            connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
                    
            if (connectionString.Contains("Server="))
            {
                //use predefined my sql connection
                builder.Services.AddDbContext<AyalasLanguageDbContext>(options =>
                    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
            }
            else
            {
                // We are running locally! Fallback to appsettings.json
                builder.Services.AddSqlite<AyalasLanguageDbContext>(connectionString);
            }
        }

    }
}
