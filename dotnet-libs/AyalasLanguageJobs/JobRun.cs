using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Logging;
using AyalasLanguageAPI.Data.Model;
using AyalasLanguageJobs.Logging;
using Microsoft.EntityFrameworkCore;

namespace AyalasLanguageJobs
{
    public class JobRun
    {
        [Required]
        protected int _jobId;
        [Required]
        protected AyalasLanguageDbContext _db;

        protected int? _batchSize = null!;
        
        protected Job? _job;
        public JobRun(int jobId, AyalasLanguageDbContext db, int? batchSize)
        {
            _jobId = jobId;
            _db = db;
            _batchSize = batchSize;
        }

        public async void Run()
        {
            _job = await _db.Jobs.FirstOrDefaultAsync(j => j.JobId == _jobId);
            if (_job == null) return;
            switch ((JobTypeEnum)_job.JobType)
            {
                case JobTypeEnum.UsersProgressUpdateOnExerciseCreate:
                    await UsersProgressUpdateOnExerciseCreateJob();
                    break;
            }
        }

        private async Task UsersProgressUpdateOnExerciseCreateJob()
        {
            var query = JobsQuery.UsersProgressUpdateOnExerciseCreate(_job.MainRecordId, _db);

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

        private async Task SetRunning(int leftToProcess)
        {
            //change to Running
            _job.LeftToProcess = leftToProcess;
            _job.JobStatus = (byte)JobStatusEnum.Running;
            _job.ModifiedOn = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        private async Task SetAsEmptyAndDone()
        {
            _job.LeftToProcess = 0;
            _job.JobStatus = (byte)JobStatusEnum.Completed;
            _job.ModifiedOn = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        private async Task HandleSuccess()
        {
            _job.Completed = _job.Completed + 1;
            _job.LeftToProcess = _job.LeftToProcess - 1;
            _job.ModifiedOn = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        private async Task HandleException(LogTypeEnum logType, bool hadErrors, Exception? ex = null)
        {
            _db.ChangeTracker.Clear();
            _job.Errors = _job.Errors + 1;
            _job.ModifiedOn = DateTime.UtcNow;
            if (!hadErrors)
            {
                _job.FirstError = ex.ToString();
            }

            JobLogging logData = new()
            {
                JobId = _jobId,
                JobType = _job.JobType,
                MainRecordId = _job.MainRecordId,
                SecondaryRecordId = _job.SecondaryRecordId,
                LeftToProcess = _job.LeftToProcess,
                ExtraData = _job.ExtraData
            };

            if (ex == null)
            {
                logData.CallStack = Environment.StackTrace;
            }
            else
            {
                logData.Error = ex.Message;
                logData.CallStack = ex.StackTrace;
            }
            Log rec = new()
            {
                LogType = (int)logType,
                Description = System.Text.Json.JsonSerializer.Serialize(logData)
            };
            _db.Logs.Add(rec);
            await _db.SaveChangesAsync();
        }

        private async Task SaveJobStatus(bool hadErrors, bool hadSuccess, bool batchOnly)
        {
            _job.ModifiedOn = DateTime.UtcNow;
            if (hadErrors)
            {
                if (hadSuccess)
                {
                    _job.JobStatus = (byte)JobStatusEnum.PartiallyFailed;
                }
                else
                {
                    _job.JobStatus = (byte)JobStatusEnum.Failed;
                }
            }
            else
            {
                if (batchOnly)
                {
                    _job.JobStatus = (byte)JobStatusEnum.Stopped;
                }
                else
                {
                    _job.JobStatus = (byte)JobStatusEnum.Completed;
                }
            }
            await _db.SaveChangesAsync();
        }
    }
}
