namespace AyalasLanguageAPI.Data.Logging
{
    public class ExerciseDataValidationFailed : LoggingBase
    {
        public int ExerciseType;
        public string Title = string.Empty;
        public string Data = string.Empty;
    }
}