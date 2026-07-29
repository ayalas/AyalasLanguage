using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using AyalasLanguageJobs.Jobs;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageJobs
{

    public static class JobsFactory
    {
       
        public static async Task<JobRun?> CreateJob(JobTypeEnum jobType, int? mainRecordId, int? secondaryRecordId, AyalasLanguageDbContext db, int? batchSize = null)
        {

            JobRun? job = null;
            switch (jobType)
            {
                case JobTypeEnum.UsersProgressUpdateOnExerciseCreate:
                if (mainRecordId == null || secondaryRecordId == null)
                        return null;
                    job = new UsersProgressUpdateOnExerciseCreate(db, mainRecordId.Value, secondaryRecordId.Value, batchSize);
                    break;
            }

            return job;
        }
    }
}
