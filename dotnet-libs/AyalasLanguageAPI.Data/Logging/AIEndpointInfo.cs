using System.ComponentModel.DataAnnotations;

namespace AyalasLanguageAPI.Data.Logging
{
    public abstract class AIEndpointBase : LoggingBase
    {
        public required string RequestData { get; set; }
        public required string Endpoint { get; set; }
        public string? Model {get; set; }
    }

    public class AIEndpointInfo : AIEndpointBase
    {
        public required string ResponseData { get; set; }
    }

    public class AIEndpointFailure : AIEndpointBase
    {

    }
}