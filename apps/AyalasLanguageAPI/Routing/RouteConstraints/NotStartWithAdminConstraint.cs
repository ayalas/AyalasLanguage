namespace AyalasLanguageAPI.Routing.RouteConstraints
{
    public class NotStartWithAdminConstraint : IRouteConstraint
    {
        public bool Match(HttpContext? httpContext, IRouter? router, string routeKey, RouteValueDictionary values, RouteDirection routeDirection)
        {
            if (values.TryGetValue(routeKey, out var value) && value is string slug)
            {
                return !slug.StartsWith("admin", StringComparison.OrdinalIgnoreCase);
            }
            return true;
        }
    }
}