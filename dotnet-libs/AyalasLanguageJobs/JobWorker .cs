using System.Threading.Channels;
using AyalasLanguageAPI.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AyalasLanguageJobs
{
    public class JobWorker : BackgroundService
    {
        private readonly IJobQueue _jobQueue;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<JobWorker> _logger;
        private readonly IConfiguration _configuration;

        public JobWorker(IJobQueue jobQueue, IServiceScopeFactory scopeFactory, ILogger<JobWorker> logger, IConfiguration configuration)
        {
            _jobQueue = jobQueue;
            _scopeFactory = scopeFactory;
            _logger = logger;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Job Worker started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Wait for a job to arrive in the channel
                    var request = await _jobQueue.DequeueJobAsync(stoppingToken);

                    // Create a scope to resolve Scoped services like DbContext
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AyalasLanguageDbContext>();
           
                    // Use your existing Factory to create the job
                    var job = JobsFactory.CreateJob(
                        request.JobType,
                        request.MainRecordId,
                        request.SecondaryRecordId,
                        db,
                        _configuration,
                        request.BatchSize);

                    if (job != null)
                    {
                        _logger.LogInformation("Running job {request.JobType}", request.JobType);
                        await job.Run();
                    }
                }
                catch (OperationCanceledException)
                {
                    // Prevent exception when shutting down
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing background job.");
                }
            }
        }
    }
}