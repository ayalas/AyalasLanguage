using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageJobs
{

    public static class JobsFactory
    {
       
        public static async Task<int?> CreateJob(JobTypeEnum jobType, int? mainRecordId, int? secondaryRecordId, AyalasLanguageDbContext db)
        {
            int numOfRecords = 0;

            switch (jobType)
            {
                case JobTypeEnum.UsersProgressUpdateOnExerciseCreate:
                    
                    if (mainRecordId == null || secondaryRecordId == null)
                        return null;
                    var query = JobsQuery.UsersProgressUpdateOnExerciseCreate(mainRecordId, db);

                    numOfRecords = await query.CountAsync();

                    //no need for a job if no records to process
                    if (numOfRecords == 0)
                        return null;
                    break;
            }

             var job = new Job
            {
                JobType = (byte)jobType,
                JobStatus = (byte)JobStatusEnum.NotStarted,
                MainRecordId = mainRecordId,
                SecondaryRecordId = secondaryRecordId,
                //ExtraData = data if needed in the future...
                LeftToProcess = numOfRecords
            };

            db.Jobs.Add(job);
            await db.SaveChangesAsync();

            return job.JobId;
        }
    }
}
