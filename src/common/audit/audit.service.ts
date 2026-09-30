import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { IEventClient } from '../client/event-client.interfaces';
import { getRequestId } from '../logger/request.context';

/** Event pattern every audit record is published with (event-server persists
 * it into the append-only audit_events store). */
export const AUDIT_EVENT_PATTERN = 'audit.event';

export interface AuditEntry {
  /** Open dot-path, e.g. auth.login.failed / access.denied / data.updated. */
  action: string;
  outcome?: 'allow' | 'deny' | 'success' | 'failure';
  accountId?: number | string;
  accountUsername?: string;
  tenantId?: number | string;
  ip?: string;
  userAgent?: string;
  /** Defaults to the current request id from the logger request context. */
  requestId?: string;
  targetType?: string;
  targetId?: string | number;
  /** MUST NOT contain secrets or plaintext passwords. */
  details?: Record<string, unknown>;
}

/**
 * Fire-and-forget security audit publisher. Records travel to the event
 * server with the `audit.event` pattern and land in its tamper-evident
 * store. Audit failures never fail the audited operation; without a bound
 * IEventClient records fall back to the structured log.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Optional() @Inject(IEventClient) private readonly client?: IEventClient) {}

  log(entry: AuditEntry): void {
    const payload: Record<string, unknown> = {
      action: entry.action,
      outcome: entry.outcome,
      accountId: entry.accountId !== undefined ? Number(entry.accountId) : undefined,
      accountUsername: entry.accountUsername,
      tenantId: entry.tenantId !== undefined ? Number(entry.tenantId) : undefined,
      ip: entry.ip,
      userAgent: entry.userAgent,
      requestId: entry.requestId ?? getRequestId(),
      targetType: entry.targetType,
      targetId:
        entry.targetId !== undefined && entry.targetId !== null ? String(entry.targetId) : undefined,
      details: entry.details,
    };
    for (const key of Object.keys(payload)) {
      if (payload[key] === undefined) delete payload[key];
    }

    if (!this.client) {
      this.logger.log(`audit-fallback ${JSON.stringify(payload)}`);
      return;
    }
    this.client.publish(AUDIT_EVENT_PATTERN, payload).catch((err: unknown) => {
      this.logger.error(
        `Failed to publish audit "${entry.action}": ${err instanceof Error ? err.message : err}`,
      );
    });
  }
}
