using System.ComponentModel.DataAnnotations;

namespace AyalasLanguageAPI.Data.Logging
{
    public class PuterEndpointFailure : LoggingBase
    {
        [Required]
        public string RequestData { get; set; }
        [Required]
        public string Endpoint { get; set; }
    }
}