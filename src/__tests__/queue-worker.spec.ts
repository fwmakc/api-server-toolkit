import { QueueWorker } from '../common/queue/queue-worker.service';
import { QueueJobEntity } from '../common/queue/queue-job.entity';
import { QueueWorkerConfig } from '../common/queue/queue.interfaces';

interface DelayedJob extends QueueJobEntity {
  duration: number;
}

class TestWorker extends QueueWorker<DelayedJob> {
  public active = 0;
  public maxActive = 0;
  public processed: number[] = [];
  public failIds = new Set<number>();

  constructor(config: Partial<QueueWorkerConfig>, repo: any = { update: jest.fn().mockResolvedValue({}) }) {
    super(repo, {
      interval: 1000,
      batchSize: 10,
      maxAttempts: 3,
      retryDelay: 1,
      ...config,
    } as QueueWorkerConfig);
  }

  protected async process(job: DelayedJob): Promise<void> {
    this.active++;
    this.maxActive = Math.max(this.maxActive, this.active);
    try {
      await new Promise((r) => setTimeout(r, job.duration));
      if (this.failIds.has(job.id)) throw new Error(`boom ${job.id}`);
      this.processed.push(job.id);
    } finally {
      this.active--;
    }
  }
}

function jobs(n: number, duration = 20): DelayedJob[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    duration,
    status: 'pending' as const,
    attempts: 0,
    lastAttemptAt: null,
    nextAttemptAt: null,
    errorMessage: null,
    createdAt: new Date(),
  } as DelayedJob));
}

// Journal №7: the historical runCycle drained a batch strictly sequentially
// (one SMTP send at a time). concurrency fans the batch out over a bounded
// pool while claiming stays locked and batched.
describe('QueueWorker bounded concurrency', () => {
  it('processes a batch sequentially by default (concurrency absent)', async () => {
    const worker = new TestWorker({});
    // access to the private batch runner is the point: no timers, no module init
    await (worker as any).processBatch(jobs(5, 15));

    expect(worker.processed).toHaveLength(5);
    expect(worker.maxActive).toBe(1);
  });

  it('concurrency: 1 preserves the sequential loop explicitly', async () => {
    const worker = new TestWorker({ concurrency: 1 });
    await (worker as any).processBatch(jobs(4, 15));

    expect(worker.processed).toHaveLength(4);
    expect(worker.maxActive).toBe(1);
  });

  it('fans the batch out up to the configured ceiling', async () => {
    const worker = new TestWorker({ concurrency: 4 });
    await (worker as any).processBatch(jobs(8, 25));

    expect(worker.processed).toHaveLength(8);
    expect(worker.maxActive).toBe(4);
  });

  it('never exceeds the pool size for small batches and processes each job once', async () => {
    const worker = new TestWorker({ concurrency: 8 });
    await (worker as any).processBatch(jobs(3, 20));

    expect(worker.processed.sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(worker.maxActive).toBe(3);
  });

  it('a failing job does not starve its batch siblings', async () => {
    const worker = new TestWorker({ concurrency: 2 });
    worker.failIds.add(2);
    await (worker as any).processBatch(jobs(4, 15));

    expect(worker.processed.sort((a, b) => a - b)).toEqual([1, 3, 4]);
  });
});
