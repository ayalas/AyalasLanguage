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
                            context.Response.Redirect("/admin/");
                            return;
                        }

                        if (path.Equals("/mobile", StringComparison.OrdinalIgnoreCase))
                        {
                            context.Response.Redirect("/mobile/");
                            return;
                        }
                    }

                    await next();
                });
            }
        }

    }
}