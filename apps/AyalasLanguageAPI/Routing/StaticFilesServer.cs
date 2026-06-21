using AyalasLanguageAPI.Routing.RouteConstraints;
using Microsoft.Extensions.FileProviders;

namespace AyalasLanguageAPI.Routing
{
    public static class StaticFilesServer
    {
        public static void ServeStaticFiles(this WebApplication app, string rootPath, IConfiguration config)
        {
            var publicFileProvider = GetFileProvider(config, rootPath, "FrontendsPhysicalFolders:public", app.Logger);
            var adminFileProvider = GetFileProvider(config, rootPath, "FrontendsPhysicalFolders:admin", app.Logger);

            // 1. Static Files Middleware (Handles physical files like .js, .css, .png)
            if (adminFileProvider != null)
            {
                app.UseStaticFiles(new StaticFileOptions
                {
                    FileProvider = adminFileProvider,
                    RequestPath = "/admin"
                });
            }

            if (publicFileProvider != null)
            {
                app.UseStaticFiles(new StaticFileOptions
                {
                    FileProvider = publicFileProvider,
                    RequestPath = "" // Root
                });
            }

            // 2. Fallback Endpoints (Handles SPA routing/refreshing)

            // ADMIN Fallback
            if (adminFileProvider != null)
            {
                app.MapFallbackToFile("/admin/{*path:nonfile}", "index.html", new StaticFileOptions
                {
                    FileProvider = adminFileProvider,
                    RequestPath = "" // Leave empty so it finds index.html in the admin folder root
                }).AllowAnonymous();
            }

            // PUBLIC Fallback
            if (publicFileProvider != null)
            {
                app.MapFallbackToFile("{*path:nonfile}", "index.html", new StaticFileOptions
                {
                    FileProvider = publicFileProvider,
                    RequestPath = ""
                }).AllowAnonymous();
            }
        }

        private static PhysicalFileProvider? GetFileProvider(IConfiguration config, string rootPath, string configKey, ILogger logger)
        {
            var relAppPath = config.GetValue<string>(configKey);
            if (string.IsNullOrEmpty(relAppPath))
            {
                logger.LogWarning($"GetFileProvider for {configKey}: missing configuration value");
                return null;
            }

            // List of potential full paths to check
            var pathsToTry = new[]
            {
                Path.Combine(rootPath, relAppPath),
                Path.Combine(AppContext.BaseDirectory, relAppPath),
                Path.GetFullPath(relAppPath)
            };

            foreach (var path in pathsToTry)
            {
                logger.LogInformation("Looking for {key} at: {path}", configKey, path);
                if (Directory.Exists(path))
                {
                    logger.LogInformation("SUCCESS: Found {key} at {path}", configKey, path);
                    return new PhysicalFileProvider(path);
                }
            }

            logger.LogError("FAILURE: Could not find directory for {key}. Checked: {paths}",
                configKey, string.Join(", ", pathsToTry));
            return null;
        }

        public static void AddRouteConstraints(this WebApplicationBuilder builder)
        {
            builder.Services.Configure<RouteOptions>(options =>
            {
                options.ConstraintMap.Add("notStartWithAdmin", typeof(NotStartWithAdminConstraint));
            });
        }
    }
}