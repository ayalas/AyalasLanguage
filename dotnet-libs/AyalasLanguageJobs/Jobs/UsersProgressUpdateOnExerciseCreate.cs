
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageJobs.Jobs
{
    public class UsersProgressUpdateOnExerciseCreate: JobRun 
    {
        public UsersProgressUpdateOnExerciseCreate(AyalasLanguageDbContext db, int mainRecordId, int secRecordId, int? batchSize = null)
            : base(JobTypeEnum.UsersProgressUpdateOnExerciseCreate, db, mainRecordId, secRecordId)
        {
            _batchSize = batchSize;
        }

        protected override async Task<int> ShouldRun()
        {
            if (_mainRecordId == null) return 0;
            var query = JobsQuery.UsersProgressUpdateOnExerciseCreate(_mainRecordId.Value, _db);
            return await query.CountAsync();
        }
        protected override async Task RunInternal()
        {
            if (_job == null || _job.MainRecordId == null) return;
            var query = JobsQuery.UsersProgressUpdateOnExerciseCreate(_job.MainRecordId.Value, _db);

            List<UserProgress>? list = null;
            bool batchOnly = false;
            if (_batchSize != null && _job.LeftToProcess != null && _batchSize < _job.LeftToProcess)
            {
                list = await query.Take(_batchSize.Value).ToListAsync();

                batchOnly = true;
            }
            else
            {
                list = await query.ToListAsync();
            }

            if (list == null || list.Count == 0)
            {
                await SetAsEmptyAndDone();
                return;
            }

            bool hadErrors = false;
            bool hadSuccess = false;

            await SetRunning(list.Count);

            foreach (UserProgress up in list)
            {
                try
                {
                    up.ExerciseId = _job.SecondaryRecordId;
                    await _db.SaveChangesAsync();
                    hadSuccess = true;
                    await HandleSuccess();
                }
                catch (Exception ex)
                {
                    //calls SaveChangesAsync for the job too
                    await HandleException(LogTypeEnum.UsersProgressUpdateOnExerciseCreateJobRunFailed, hadErrors, ex);
                    hadErrors = true;
                }
            }

            //save job status
            await SaveJobStatus(hadErrors, hadSuccess, batchOnly);
        }
    }
}