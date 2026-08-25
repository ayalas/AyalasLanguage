namespace AyalasLanguageAPI.Routing.RouteConstraints
{
    public class NotStartWithSubUrlConstraint : IRouteConstraint
    {
        public bool Match(HttpContext? httpContext, IRouter? router, string routeKey, RouteValueDictionary values, RouteDirection routeDirection)
        {
            if (values.TryGetValue(routeKey, out var value) && value is string slug)
            {
                return !slug.StartsWith("admin", StringComparison.OrdinalIgnoreCase) &&
                    !slug.StartsWith("mobile", StringComparison.OrdinalIgnoreCase);
            }
            return true;
        }
    }
}