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

            // 1. ADMIN SITE
            if (adminFileProvider != null)
            {
                var adminOptions = new StaticFileOptions
                {
                    FileProvider = adminFileProvider,
                    RequestPath = "/admin"
                };

                app.UseDefaultFiles(new DefaultFilesOptions
                {
                    FileProvider = adminFileProvider,
                    RequestPath = "/admin"
                });
                app.UseStaticFiles(adminOptions);

                // Map fallback only for paths under /admin that are NOT files
                app.MapFallbackToFile("/admin/{*path:nonfile}", "index.html", adminOptions);
            }

            // 2. PUBLIC SITE (Root)
            if (publicFileProvider != null)
            {
                var publicOptions = new StaticFileOptions
                {
                    FileProvider = publicFileProvider,
                    RequestPath = "" // Root
                };

                app.UseDefaultFiles(new DefaultFilesOptions
                {
                    FileProvider = publicFileProvider,
                    RequestPath = ""
                });
                app.UseStaticFiles(publicOptions);

                // IMPORTANT: Use a constraint to stop this fallback from hijacking /admin
                // And use :nonfile to stop the MIME type error
                app.MapFallbackToFile("{*path:nonfile}", "index.html", publicOptions);
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

            // Check three possible locations
            var pathsToTry = new[] {
                Path.Combine(rootPath, relAppPath),
                Path.Combine(AppContext.BaseDirectory, relAppPath),
                Path.GetFullPath(relAppPath) // Absolute path check
            };

            foreach (var path in pathsToTry)
            {
                logger.LogInformation("Checking for {ConfigKey} at: {Path}", configKey, path);
                if (Directory.Exists(path))
                {
                    logger.LogInformation("FOUND {ConfigKey} at: {Path}", configKey, path);
                    return new PhysicalFileProvider(path);
                }
            }

            logger.LogError("COULD NOT FIND directory for {ConfigKey}. Checked: {Paths}", configKey, string.Join(", ", pathsToTry));
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