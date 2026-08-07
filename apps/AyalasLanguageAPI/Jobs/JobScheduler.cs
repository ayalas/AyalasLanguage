using AyalasLanguageAPI.Jobs.JobInvocables;
using AyalasLanguageJobs;
using Coravel;

namespace AyalasLanguageAPI.Jobs;

public static class JobScheduler
{
    public static void AddJobServices(this WebApplicationBuilder builder)
    {
        builder.Services.AddSingleton<IJobQueue>(new JobQueue(500));
        builder.Services.AddHostedService<JobWorker>();

        builder.Services.AddScheduler();
        builder.Services.AddTransient<DeleteOldLogsJobInvocable>();
        builder.Services.AddTransient<DeleteOldTokensJobInvocable>();
    }

    public static void UseJobScheduler(this WebApplication app)
    {
        var jobSettings = app.Configuration.GetSection("JobSettings");

        app.Services.UseScheduler(scheduler =>
        {
            // Schedule DeleteOldLogsJob
            var deleteOldLogsJobCron = jobSettings.GetSection("DeleteOldLogsJob").GetValue<string>("CronExpression");
            if (!string.IsNullOrEmpty(deleteOldLogsJobCron))
            {
                scheduler.Schedule<DeleteOldLogsJobInvocable>()
                    .Cron(deleteOldLogsJobCron)
                    .Zoned(TimeZoneInfo.Utc);
            }

            // Schedule DeleteOldTokensJob
            var deleteOldTokensJobCron = jobSettings.GetSection("DeleteOldTokensJob").GetValue<string>("CronExpression");
            if (!string.IsNullOrEmpty(deleteOldTokensJobCron))
            {
                scheduler.Schedule<DeleteOldTokensJobInvocable>()
                    .Cron(deleteOldTokensJobCron)
                    .Zoned(TimeZoneInfo.Utc);
            }
        });
    }
}