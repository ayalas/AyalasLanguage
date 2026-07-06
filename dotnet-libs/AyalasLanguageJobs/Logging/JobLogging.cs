using AyalasLanguageAPI.Data.Logging;

namespace AyalasLanguageJobs.Logging
{
    public class JobLogging : LoggingBase
    {
        public int JobId;
        public byte JobType;
        public int? MainRecordId = null!;
        public int? SecondaryRecordId= null!;
        public string? ExtraData = null;
        public int? LeftToProcess = null!;
    }
}