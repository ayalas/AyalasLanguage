namespace AyalasLanguageAPI.Data.Logging
{
    public class ExerciseDataValidationFailed : LoggingBase
    {
        public int ExerciseType { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Data { get; set; } = string.Empty;
    }
}