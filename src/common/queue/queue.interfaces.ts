export type QueueStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface QueueWorkerConfig {
  interval: number;
  maxInterval?: number;
  batchSize: number;
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
