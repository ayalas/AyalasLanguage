using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using AyalasLanguageJobs.Jobs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AyalasLanguageJobs
{

    public static class JobsFactory
    {
       
        public static async Task<JobRun?> CreateJob(JobTypeEnum jobType, int? mainRecordId, int? secondaryRecordId, AyalasLanguageDbContext db, IConfiguration configuration, int? batchSize = null)
        {

            JobRun? job = null;
            switch (jobType)
            {
                case JobTypeEnum.UsersProgressUpdateOnExerciseCreate:
                if (mainRecordId == null || secondaryRecordId == null)
                        return null;
                    job = new UsersProgressUpdateOnExerciseCreate(db, configuration, mainRecordId.Value, secondaryRecordId.Value, batchSize);
                    break;
                case JobTypeEnum.DeleteOldLogs:
                    job = new DeleteOldLogs(db, configuration);
                    break;
                case JobTypeEnum.DeleteOldTokens:
                    job = new DeleteOldTokens(db, configuration);
                    break;
            }

            return job;
        }
    }
}
