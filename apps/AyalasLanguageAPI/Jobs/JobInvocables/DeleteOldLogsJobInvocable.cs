using AyalasLanguageJobs;
using Coravel.Invocable;

namespace AyalasLanguageAPI.Jobs.JobInvocables;
public class DeleteOldLogsJobInvocable(IJobQueue jobQueue) : IInvocable
{
    private readonly IJobQueue _jobQueue = jobQueue;

    public async Task Invoke()
    {
        await _jobQueue.EnqueueJobAsync(new JobRequest(Data.JobTypeEnum.DeleteOldLogs, null, null, null));
    }
}