
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AyalasLanguageJobs.Jobs
{
    public class DeleteOldLogs: JobRun 
    {
        protected int _daysBack = 180;
        public DeleteOldLogs(AyalasLanguageDbContext db, IConfiguration configuration) : base(JobTypeEnum.DeleteOldLogs, db, configuration)
        {
            _ = int.TryParse(configuration.GetSection("JobSettings:DeleteOldLogs:DaysBack").Value, out _daysBack);
        }   
        protected override async Task<int> ShouldRun()
        {
            var query = JobsQuery.DeleteOldLogs(_daysBack, _db);
            return await query.CountAsync();
        }
        protected override async Task RunInternal()
        {
            if (_job == null) return;
            var query = JobsQuery.DeleteOldLogs(_daysBack, _db);

            List<Log>? list = null;
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

            foreach (Log log in list)
            {
                try
                {
                    _db.Logs.Remove(log);
                    await _db.SaveChangesAsync();
                    hadSuccess = true;
                    await HandleSuccess();
                }
                catch (Exception ex)
                {
                    //calls SaveChangesAsync for the job too
                    await HandleException(LogTypeEnum.DeleteOldLogsJobRunFailed, hadErrors, ex);
                    hadErrors = true;
                }
            }

            //save job status
            await SaveJobStatus(hadErrors, hadSuccess, batchOnly);
        }
    }
}