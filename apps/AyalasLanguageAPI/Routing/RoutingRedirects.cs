namespace AyalasLanguageAPI.Routing
{
    public static class RoutingRedirects
    {
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