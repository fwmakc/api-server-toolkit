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
  private readonly maxInterval: number;
  private readonly staleTimeout: number;
  private currentDelay: number;
  private destroyed = false;

  constructor(
    protected readonly repo: Repository<TJob>,
    protected readonly queueConfig: QueueWorkerConfig,
  ) {
    this.currentDelay = queueConfig.interval;
    this.maxInterval = queueConfig.maxInterval ?? queueConfig.interval * 5;
    this.staleTimeout = queueConfig.staleTimeout ?? 300000;
  }

  protected abstract process(job: TJob): Promise<void>;

  onModuleInit(): void {
    this.scheduleNextCycle();

    if (this.queueConfig.cleanup) {
      this.cleanupTimer = setInterval(() => {
        this.runCleanup().catch((err) =>
          this.logger.error(`Cleanup error: ${err.message}`, err.stack),
        );
      }, this.queueConfig.cleanup.interval);
    }

    this.logger.log(
      `Worker started (interval=${this.queueConfig.interval}-${this.maxInterval}ms adaptive, batch=${this.queueConfig.batchSize})`,
    );
  }

  onModuleDestroy(): void {
    this.destroyed = true;
    if (this.workTimer) clearTimeout(this.workTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  private scheduleNextCycle(): void {
    if (this.destroyed) return;
    this.workTimer = setTimeout(async () => {
      await this.runCycle().catch((err) =>
        this.logger.error(`Cycle error: ${err.message}`, err.stack),
      );
      this.scheduleNextCycle();
    }, this.currentDelay);
  }

  private async runCycle(): Promise<void> {
    const jobs = await this.claimJobs();

    if (jobs.length > 0) {
      if (this.currentDelay !== this.queueConfig.interval) {
        this.logger.log(`Work found, resuming at ${this.queueConfig.interval}ms`);
      }
      this.currentDelay = this.queueConfig.interval;

      for (const job of jobs) {
        await this.processJob(job);
      }
    } else {
      const prev = this.currentDelay;
      this.currentDelay = Math.min(
        this.currentDelay * 2,
        this.maxInterval,
      );
      if (prev !== this.currentDelay) {
        this.logger.debug(`Idle, back off to ${this.currentDelay}ms`);
      }
    }
  }

  private async claimJobs(): Promise<TJob[]> {
    const now = new Date();
    const staleBefore = new Date(Date.now() - this.staleTimeout);

    return this.repo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(this.repo.target) as Repository<TJob>;

      const qb = repo
        .createQueryBuilder('j')
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .where(
          `(j.status = 'pending' AND (j.next_attempt_at IS NULL OR j.next_attempt_at <= :now))
           OR (j.status = 'processing' AND j.last_attempt_at < :staleBefore)`,
          { now, staleBefore },
        )
        .orderBy('j.id', 'ASC')
        .take(this.queueConfig.batchSize);

      this.loadRelations(qb);
      const jobs = await qb.getMany();

      if (jobs.length > 0) {
        await repo
          .createQueryBuilder('j')
          .update()
          .set({ status: 'processing' as QueueStatus, lastAttemptAt: new Date() } as any)
          .where('j.id IN (:...ids)', { ids: jobs.map((j) => j.id) })
          .execute();
      }

      return jobs;
    });
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
      await this.handleFailure(job, err instanceof Error ? err : new Error(String(err)));
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
        status: 'pending' as QueueStatus,
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
