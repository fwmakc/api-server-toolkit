import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { QueueJobEntity } from './queue-job.entity';
import { QueueStatus, QueueWorkerConfig } from './queue.interfaces';

export abstract class QueueWorker<TJob extends QueueJobEntity>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(this.constructor.name);
  private workTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    protected readonly repo: Repository<TJob>,
    protected readonly queueConfig: QueueWorkerConfig,
  ) {}

  protected abstract process(job: TJob): Promise<void>;

  onModuleInit(): void {
    this.workTimer = setInterval(() => {
      this.runCycle().catch((err) =>
        this.logger.error(`Cycle error: ${err.message}`, err.stack),
      );
    }, this.queueConfig.interval);

    if (this.queueConfig.cleanup) {
      this.cleanupTimer = setInterval(() => {
        this.runCleanup().catch((err) =>
          this.logger.error(`Cleanup error: ${err.message}`, err.stack),
        );
      }, this.queueConfig.cleanup.interval);
    }

    this.logger.log(
      `Worker started (interval=${this.queueConfig.interval}ms, batch=${this.queueConfig.batchSize})`,
    );
  }

  onModuleDestroy(): void {
    if (this.workTimer) clearInterval(this.workTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  private async runCycle(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const qb = this.repo
        .createQueryBuilder('j')
        .where('j.status = :status', { status: 'pending' })
        .andWhere(
          '(j.next_attempt_at IS NULL OR j.next_attempt_at <= :now)',
          { now: new Date() },
        )
        .orderBy('j.id', 'ASC')
        .take(this.queueConfig.batchSize);

      this.loadRelations(qb);

      const jobs = await qb.getMany();

      for (const job of jobs) {
        await this.processJob(job);
      }
    } finally {
      this.running = false;
    }
  }

  protected loadRelations(qb: import('typeorm').SelectQueryBuilder<TJob>): void {
    // subclasses override to add leftJoinAndSelect for eager relations
  }

  private async processJob(job: TJob): Promise<void> {
    try {
      await this.process(job);
      await this.repo.update(job.id, {
        status: 'done' as QueueStatus,
        lastAttemptAt: new Date(),
        nextAttemptAt: null,
      } as any);
    } catch (err) {
      await this.handleFailure(job, err);
    }
  }

  private async handleFailure(job: TJob, error: Error): Promise<void> {
    const attemptNumber = job.attempts + 1;
    const errorMessage = this.formatError(error);

    if (attemptNumber >= this.queueConfig.maxAttempts) {
      await this.repo.update(job.id, {
        status: 'failed' as QueueStatus,
        attempts: attemptNumber,
        lastAttemptAt: new Date(),
        nextAttemptAt: null,
        errorMessage,
      } as any);
      this.logger.warn(
        `Job ${job.id} FAILED permanently (attempt ${attemptNumber}/${this.queueConfig.maxAttempts}): ${errorMessage}`,
      );
    } else {
      const backoffMs =
        this.queueConfig.retryDelay * 1000 * Math.pow(2, attemptNumber - 1);
      const nextAttempt = new Date(Date.now() + backoffMs);
      await this.repo.update(job.id, {
        attempts: attemptNumber,
        lastAttemptAt: new Date(),
        nextAttemptAt: nextAttempt,
        errorMessage,
      } as any);
      this.logger.warn(
        `Job ${job.id} retry at ${nextAttempt.toISOString()} (attempt ${attemptNumber}/${this.queueConfig.maxAttempts})`,
      );
    }
  }

  protected formatError(error: Error): string {
    return error.message || String(error);
  }

  private async runCleanup(): Promise<void> {
    if (!this.queueConfig.cleanup) return;

    const cutoff = new Date(
      Date.now() - this.queueConfig.cleanup.maxAgeDays * 86400000,
    );
    const statuses =
      this.queueConfig.cleanup.statuses ?? (['done', 'failed'] as QueueStatus[]);

    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('status IN (:...statuses)', { statuses })
      .andWhere('created_at < :cutoff', { cutoff })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(
        `Cleanup: removed ${result.affected} old jobs (statuses: [${statuses.join(', ')}], older than ${this.queueConfig.cleanup.maxAgeDays}d)`,
      );
    }
  }
}
