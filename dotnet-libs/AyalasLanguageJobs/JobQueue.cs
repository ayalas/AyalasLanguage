using AyalasLanguageAPI.Data;
using System.Threading.Channels;

namespace AyalasLanguageJobs
{
    public record JobRequest(
        JobTypeEnum JobType,
        int? MainRecordId,
        int? SecondaryRecordId,
        int? BatchSize
    );

    public interface IJobQueue
    {
        ValueTask EnqueueJobAsync(JobRequest job);
        ValueTask<JobRequest> DequeueJobAsync(CancellationToken cancellationToken);
    }

    public class JobQueue : IJobQueue
    {
        private readonly Channel<JobRequest> _queue;

        public JobQueue(int capacity = 100)
        {
            // Bounded channel prevents memory issues if the producer is faster than the consumer
            var options = new BoundedChannelOptions(capacity)
            {
                FullMode = BoundedChannelFullMode.Wait
            };
            _queue = Channel.CreateBounded<JobRequest>(options);
        }

        public async ValueTask EnqueueJobAsync(JobRequest job)
        {
            await _queue.Writer.WriteAsync(job);
        }

        public async ValueTask<JobRequest> DequeueJobAsync(CancellationToken cancellationToken)
        {
            return await _queue.Reader.ReadAsync(cancellationToken);
        }
    }
}