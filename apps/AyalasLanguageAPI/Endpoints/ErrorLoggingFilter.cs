namespace AyalasLanguageAPI.Endpoints
{
    public class ErrorLoggingFilter : IEndpointFilter
    {
        private readonly ILogger<ErrorLoggingFilter> _logger;

        public ErrorLoggingFilter(ILogger<ErrorLoggingFilter> logger)
        {
            _logger = logger;
        }

        public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
        {
            try
            {
                return await next(context);
            }
            catch (Exception ex)
            {
                // Dynamically get the method name from the endpoint metadata
                var methodName = context.HttpContext.GetEndpoint()?.DisplayName ?? "UnknownEndpoint";

                _logger.LogError(ex, "{MethodName}: An unhandled exception occurred.", methodName);

                // You can return the 'default' like your original code, 
                // but in an API it's usually better to return a TypedResults.Problem()
                return Results.Problem("An internal error occurred.");
            }
        }
    }
}