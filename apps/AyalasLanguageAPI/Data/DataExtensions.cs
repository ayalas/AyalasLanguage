using System;
using AyalasLanguageAPI.Data.Model;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageAPI.Data;

public static class DataExtensions
{
    public static void MigrateDb(this WebApplication app)
    {
        using (var scope = app.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<AyalasLanguageDbContext>();

            // Get the name of the current provider (e.g., "Microsoft.EntityFrameworkCore.Sqlite" or "Pomelo.EntityFrameworkCore.MySql")
            var providerName = context.Database.ProviderName;
            if (providerName == null)
                throw new Exception("context.Database.ProviderName is empty");

            // Retrieve all pending migrations
            var pendingMigrations = context.Database.GetPendingMigrations();

            foreach (var migration in pendingMigrations)
            {
                // Safety Check: Ensure the migration matches your intended provider
                if (providerName.Contains("MySql", StringComparison.OrdinalIgnoreCase) && !migration.Contains("MySQL", StringComparison.OrdinalIgnoreCase))
                {
                    // Skip SQLite migrations when running on MySQL
                    continue;
                }
                if (providerName.Contains("Sqlite", StringComparison.OrdinalIgnoreCase) && migration.Contains("MySQL", StringComparison.OrdinalIgnoreCase))
                {
                    // Skip MySQL migrations when running on local SQLite
                    continue;
                }

                // Apply only the correct, isolated migration
                context.Database.Migrate();
            }
        }

    }

    public static void AddAyalasLanguageDb(this WebApplicationBuilder builder)
    {
        // 1. Attempt to read AWS RDS environment variables
        var rdsHost = Environment.GetEnvironmentVariable("RDS_HOSTNAME");
        string? connectionString = null;
        bool isRDS = false;
        if (!string.IsNullOrEmpty(rdsHost))
        {
            // We are running in AWS Beanstalk! Build the MySQL connection string dynamically.
            var rdsPort = Environment.GetEnvironmentVariable("RDS_PORT") ?? "3306";
            var rdsUser = Environment.GetEnvironmentVariable("RDS_USERNAME");
            var rdsPass = Environment.GetEnvironmentVariable("RDS_PASSWORD");
            var rdsDb = Environment.GetEnvironmentVariable("RDS_DB_NAME");
            isRDS = true;
            connectionString = $"Server={rdsHost};Port={rdsPort};Database={rdsDb};Uid={rdsUser};Pwd={rdsPass};";
        }
        else
        {
            connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        if (isRDS || connectionString.Contains("Server=", StringComparison.OrdinalIgnoreCase))
        {
            ServerVersion serverVersion;
            if (builder.Environment.IsDevelopment())
            {
                // Hardcode your production target version for ef migrations
                serverVersion = new MySqlServerVersion(new Version(8, 4, 8));
            }
            else
            {
                // On production / AWS, use AutoDetect safely
                serverVersion = ServerVersion.AutoDetect(connectionString);
            }

            //use predefined my sql connection
            builder.Services.AddDbContext<AyalasLanguageDbContext>(options =>
            {
                options.UseMySql(connectionString, serverVersion,
                    b => b.MigrationsHistoryTable("__EFMigrationsHistory")
                    .MigrationsAssembly("AyalasLanguageAPI.Data.Migrations.MySQL"));

                options.UseAsyncSeeding(async (context, _, cancellationToken) =>
                {
                    await context.MakeFirstUserAdminBySeeding(cancellationToken);
                });
            });
        }
        else
        {
            builder.Services.AddSqlite<AyalasLanguageDbContext>(connectionString,
            options =>
            {
                options.MigrationsAssembly("AyalasLanguageAPI.Data.Migrations.SQLite");
            });
        }
    }

    private static async Task MakeFirstUserAdminBySeeding(this DbContext context, CancellationToken cancellationToken)
    {
        var adminUser = await context.Set<User>()
           .FirstOrDefaultAsync(u => u.UserId == 1, cancellationToken);

        if (adminUser != null && adminUser.Role != (int)UserRoleEnum.Admin)
        {
            adminUser.Role = (int)UserRoleEnum.Admin;
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    public static async Task MakeFirstUserAdmin(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AyalasLanguageDbContext>();

        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.UserId == 1);

        if (adminUser != null && adminUser.Role != (int)UserRoleEnum.Admin)
        {
            adminUser.Role = (int)UserRoleEnum.Admin;
            await context.SaveChangesAsync();
        }
    }
}
