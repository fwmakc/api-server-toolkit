export type QueueStatus = 'pending' | 'done' | 'failed';

export interface QueueWorkerConfig {
  interval: number;
  maxInterval?: number;
  batchSize: number;
  maxAttempts: number;
  retryDelay: number;
  cleanup?: QueueCleanupConfig;
}

export interface QueueCleanupConfig {
  interval: number;
  maxAgeDays: number;
  statuses?: QueueStatus[];
}
