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

            // 1. Setup Admin Site
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

                // This ensures any request starting with /admin that isn't a file or API 
                // lands on the admin index.html
                app.MapFallbackToFile("/admin/{**slug}", "index.html", adminOptions);
            }

            // 2. Setup Public Site
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

                // Fallback for the main app (root)
                // We use a constraint to ensure it doesn't accidentally hijack /admin
                app.MapFallbackToFile("{**slug:notStartWithAdmin}", "index.html", publicOptions);
            }
        }

        private static PhysicalFileProvider? GetFileProvider(IConfiguration config, string rootPath, string configKey, ILogger logger)
        {
            var relAppPath = config.GetValue<string>(configKey);
            if (relAppPath == null)
            {
                logger.LogWarning($"GetFileProvider for {configKey}: missing configuration value");
                return null;
            }
            var appPath = Path.Combine(rootPath, relAppPath);

            // Fallback check if running inside a containerized production environment
            if (!Directory.Exists(appPath))
            {
                logger.LogWarning($"GetFileProvider for {configKey}: {appPath} path does not exist. Attempting to create {relAppPath} in {AppContext.BaseDirectory}");
                appPath = Path.Combine(AppContext.BaseDirectory, relAppPath);
            }

            return new PhysicalFileProvider(appPath);
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