export type QueueStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface QueueWorkerConfig {
  interval: number;
  maxInterval?: number;
  batchSize: number;
  /** Jobs processed in parallel within one claimed batch. 1 (default) keeps
   * the historical sequential behavior. Concurrency applies INSIDE the batch
   * only — claiming stays batched and locked (SKIP LOCKED), so multiple
   * worker replicas remain safe. (journal №7: sequential mail worker) */
  concurrency?: number;
  maxAttempts: number;
  retryDelay: number;
  staleTimeout?: number;
  cleanup?: QueueCleanupConfig;
}

export interface QueueCleanupConfig {
  interval: number;
  maxAgeDays: number;
  statuses?: QueueStatus[];
}
