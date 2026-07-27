namespace AyalasLanguageAPI.Data.Logging
{


    public abstract class LoggingBase
    {
        public string? Error { get; set; }
        public string? CallStack { get; set; } = string.Empty;
        
    }
}