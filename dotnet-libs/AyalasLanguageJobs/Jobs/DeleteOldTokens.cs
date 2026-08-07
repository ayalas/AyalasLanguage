
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AyalasLanguageJobs.Jobs
{
    public class DeleteOldTokens: JobRun
    {
        protected int _daysBack = 180;
        public DeleteOldTokens(AyalasLanguageDbContext db, IConfiguration configuration) : base(JobTypeEnum.DeleteOldTokens, db, configuration)
        {
            _ = int.TryParse(configuration.GetSection("JobSettings:DeleteOldTokens:DaysBack").Value, out _daysBack);
        }  
        protected override async Task<int> ShouldRun()
        {
            var query = JobsQuery.DeleteOldTokens(_daysBack, _db);
            return await query.CountAsync();
        }
        protected override async Task RunInternal()
        {
            if (_job == null) return;
            var query = JobsQuery.DeleteOldTokens(_daysBack, _db);

            List<Token>? list = null;
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

            foreach (Token token in list)
            {
                try
                {
                    _db.Tokens.Remove(token);
                    await _db.SaveChangesAsync();
                    hadSuccess = true;
                    await HandleSuccess();
                }
                catch (Exception ex)
                {
                    //calls SaveChangesAsync for the job too
                    await HandleException(LogTypeEnum.DeleteOldTokensJobRunFailed, hadErrors, ex);
                    hadErrors = true;
                }
            }

            //save job status
            await SaveJobStatus(hadErrors, hadSuccess, batchOnly);
        }
    }
}