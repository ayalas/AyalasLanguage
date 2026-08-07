using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using AyalasLanguageAPI.Data;
using AyalasLanguageAPI.Data.Logging;
using AyalasLanguageAPI.Data.Model;
using AyalasLanguageJobs.Logging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AyalasLanguageJobs
{
    public abstract class JobRun
    {

        protected int _jobId;
        protected AyalasLanguageDbContext _db;
        protected IConfiguration _configuration;

        protected JobTypeEnum _jobType;

        protected int? _batchSize = null!;
        
        protected Job? _job;

        protected int? _mainRecordId =  null!;

        protected int? _secondaryRecordId =  null!;

        protected abstract Task<int> ShouldRun();
        protected abstract Task RunInternal();

        public JobRun(JobTypeEnum jobType, AyalasLanguageDbContext db, IConfiguration configuration)
        {
            _jobType = jobType;
            _db = db;
            _configuration = configuration;
        }

        public JobRun(JobTypeEnum jobType, AyalasLanguageDbContext db, IConfiguration configuration, int mainRecordId)
        {
            _jobType = jobType;
            _db = db;
            _mainRecordId = mainRecordId;
            _configuration = configuration;
        }

        public JobRun(JobTypeEnum jobType, AyalasLanguageDbContext db, IConfiguration configuration, int mainRecordId, int secondaryRecordId)
        {
            _jobType = jobType;
            _db = db;
            _configuration = configuration;
            _mainRecordId = mainRecordId;
            _secondaryRecordId = secondaryRecordId;
        }

        private async Task<Job?> CreateJob()
        {
            int numOfRecords = await ShouldRun();
            if (numOfRecords == 0) return null;
            var job = new Job
            {
                JobType = (byte)_jobType,
                JobStatus = (byte)JobStatusEnum.NotStarted,
                MainRecordId = _mainRecordId,
                SecondaryRecordId = _secondaryRecordId,
                //ExtraData = data if needed in the future...
                LeftToProcess = numOfRecords
            };

            _db.Jobs.Add(job);
            await _db.SaveChangesAsync();

            return job;
        }

        public async Task Run()
        {
            _job = await CreateJob();
            if (_job == null) return;
            await RunInternal();
        }

        protected async Task SetRunning(int leftToProcess)
        {
            //change to Running
            if (_job == null) return;
            _job.LeftToProcess = leftToProcess;
            _job.JobStatus = (byte)JobStatusEnum.Running;
            _job.ModifiedOn = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        protected async Task SetAsEmptyAndDone()
        {
            if (_job == null) return;
            _job.LeftToProcess = 0;
            _job.JobStatus = (byte)JobStatusEnum.Completed;
            _job.ModifiedOn = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        protected async Task HandleSuccess()
        {
            if (_job == null) return;
            _job.Completed = _job.Completed + 1;
            _job.LeftToProcess = _job.LeftToProcess - 1;
            _job.ModifiedOn = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        protected async Task HandleException(LogTypeEnum logType, bool hadErrors, Exception? ex = null)
        {
            if (_job == null) return;
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

        protected async Task SaveJobStatus(bool hadErrors, bool hadSuccess, bool batchOnly)
        {
            if (_job == null) return;
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
