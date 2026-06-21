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

            // --- 1. ADMIN SITE CONFIG ---
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

                // This catches /admin, /admin/, and /admin/any/sub/path
                // We add AllowAnonymous to prevent the "AdminAuth was challenged" error
                app.MapFallbackToFile("/admin/{**slug}", "index.html", adminOptions).AllowAnonymous();
            }

            // --- 2. PUBLIC SITE CONFIG ---
            if (publicFileProvider != null)
            {
                var publicOptions = new StaticFileOptions
                {
                    FileProvider = publicFileProvider,
                    RequestPath = ""
                };

                app.UseDefaultFiles(new DefaultFilesOptions
                {
                    FileProvider = publicFileProvider,
                    RequestPath = ""
                });

                app.UseStaticFiles(publicOptions);

                // Fallback for the public app, excluding anything starting with /admin
                app.MapFallbackToFile("{**slug:notStartWithAdmin}", "index.html", publicOptions).AllowAnonymous();
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