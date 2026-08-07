using AyalasLanguageJobs;
using Coravel.Invocable;

namespace AyalasLanguageAPI.Jobs.JobInvocables;
public class DeleteOldTokensJobInvocable(IJobQueue jobQueue) : IInvocable
{
    private readonly IJobQueue _jobQueue = jobQueue;

    public async Task Invoke()
    {
        await _jobQueue.EnqueueJobAsync(new JobRequest(Data.JobTypeEnum.DeleteOldTokens, null, null, null));
    }
}