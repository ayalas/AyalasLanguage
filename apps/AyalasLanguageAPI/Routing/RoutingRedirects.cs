namespace AyalasLanguageAPI.Routing
{
    public static class RoutingRedirects
    {
        public static void RedirectToAdminRoot(this WebApplication app)
        {
            if (!app.Environment.IsDevelopment())
            {
                app.Use(async (context, next) =>
                {
                    if (context.Request.Path.Value != null &&
                        context.Request.Path.Value.Equals("/admin", StringComparison.OrdinalIgnoreCase))
                    {
                        context.Response.Redirect("/admin/");
                        return;
                    }
                    await next();
                });
            }
        }

    }
}