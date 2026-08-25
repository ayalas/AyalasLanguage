using Microsoft.AspNetCore.HttpOverrides;

namespace AyalasLanguageAPI.Routing
{
    public static class RoutingRedirects
    {
        // support forward headers for reverse proxy scenarios (e.g., when deployed behind Nginx or Apache)
        public static void SetForwardOptions(this WebApplication app)
        {
            var options = new ForwardedHeadersOptions
            {
                ForwardedHeaders = ForwardedHeaders.XForwardedFor |
                       ForwardedHeaders.XForwardedProto |
                       ForwardedHeaders.XForwardedHost
            };

            // trust the Caddy proxy
            options.KnownNetworks.Clear();
            options.KnownProxies.Clear();

            app.UseForwardedHeaders(options);
        }
        public static void RedirectToSubApps(this WebApplication app)
        {
            if (!app.Environment.IsDevelopment())
            {
                app.Use(async (context, next) =>
                {
                    var path = context.Request.Path.Value;
                    if (path != null)
                    {
                        if (path.Equals("/admin", StringComparison.OrdinalIgnoreCase))
                        {
                            var adminTarget = "/admin/" + context.Request.QueryString.Value;
                            context.Response.Redirect(adminTarget);
                            return;
                        }

                        if (path.Equals("/mobile", StringComparison.OrdinalIgnoreCase))
                        {
                            var mobileTarget = "/mobile/" + context.Request.QueryString.Value;
                            context.Response.Redirect(mobileTarget);
                            return;
                        }
                    }

                    await next();
                });
            }
        }

    }
}