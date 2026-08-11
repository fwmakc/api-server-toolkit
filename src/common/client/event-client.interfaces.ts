export interface PublishOptions {
  source?: string;
  broadcast?: boolean;
  priority?: "low" | "normal" | "high";
  delay?: number;
  log?: boolean;
  ttl?: number;
}

export abstract class IEventClient {
  abstract publish(
    pattern: string,
    payload: Record<string, unknown>,
    options?: PublishOptions
  ): Promise<void>;
}
