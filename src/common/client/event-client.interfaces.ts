export interface PublishOptions {
  source?: string;
  broadcast?: boolean;
  priority?: "low" | "normal" | "high";
  delay?: number;
  log?: boolean;
  ttl?: number;
  /** EntityManager of the CALLER's transaction: the event row is written in
   * the same transaction (commit together, roll back together). Omitted —
   * the client persists in its own implicit transaction, and publish() never
   * rejects: failures are logged, matching the fire-and-forget contract. */
  manager?: import("typeorm").EntityManager;
}

export abstract class IEventClient {
  abstract publish(
    pattern: string,
    payload: Record<string, unknown>,
    options?: PublishOptions
  ): Promise<void>;
}
