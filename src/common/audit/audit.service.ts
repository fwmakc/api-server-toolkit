import { Inject, Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import type { Counter } from 'prom-client';
import { IEventClient } from '../client/event-client.interfaces';
import { getRequestId } from '../logger/request.context';
import { MetricsService } from '../metrics/metrics.service';

/** Event pattern every audit record is published with (event-server persists
 * it into the append-only audit_events store). */
export const AUDIT_EVENT_PATTERN = 'audit.event';

/** DI token for the audit filter resolved by AuditModule.forRoot. */
export const AUDIT_OPTIONS = 'AUDIT_OPTIONS';

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

export interface AuditFilterOptions {
  /** Emergency kill switch for the whole audit pipeline: with false no
   * service produces audit records at all — the interceptor, AccessGuard
   * and explicit calls all funnel through log(). Default: true. */
  enabled?: boolean;
  /** If non-empty, only actions matching one of these dot-path prefixes are
   * recorded (e.g. ['access.', 'auth.'] keeps the low-volume high-value
   * events and sheds the data.* bulk). Default: keep everything. */
  include?: string[];
  /** Actions matching one of these dot-path prefixes are dropped (checked
   * after include; e.g. ['data.updated']). Default: drop nothing. */
  exclude?: string[];
}

/** Dot-boundary prefix match: 'auth' matches 'auth.login.failed' and the
 * exact action 'auth', but not 'audit.x' or 'author.x'. */
export function auditActionMatches(action: string, prefix: string): boolean {
  if (action === prefix) return true;
  const bound = prefix.endsWith('.') ? prefix : `${prefix}.`;
  return action.startsWith(bound);
}

const parseList = (raw: string | undefined): string[] | undefined =>
  raw === undefined
    ? undefined
    : raw
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0);

/** Merge explicit options with env defaults (explicit wins). Env names:
 * AUDIT_ENABLED ('false' disables), AUDIT_INCLUDE, AUDIT_EXCLUDE
 * (comma-separated dot-path prefixes). */
export function resolveAuditFilter(
  partial: AuditFilterOptions = {},
  env: NodeJS.ProcessEnv = process.env,
): Required<AuditFilterOptions> {
  return {
    enabled: partial.enabled ?? (env.AUDIT_ENABLED ? env.AUDIT_ENABLED !== 'false' : true),
    include: partial.include ?? parseList(env.AUDIT_INCLUDE) ?? [],
    exclude: partial.exclude ?? parseList(env.AUDIT_EXCLUDE) ?? [],
  };
}

/**
 * Fire-and-forget security audit publisher. Records travel to the event
 * server with the `audit.event` pattern and land in its tamper-evident
 * store. Audit failures never fail the audited operation; without a bound
 * IEventClient records fall back to the structured log. The resolved
 * filter (enabled/include/exclude) is applied BEFORE publishing, so a
 * filtered entry costs nothing — no bus traffic, no outbox row.
 */
@Injectable()
export class AuditService implements OnModuleInit {
  private readonly logger = new Logger(AuditService.name);
  private readonly filter: Required<AuditFilterOptions>;
  private readonly eventsCounter?: Counter<string>;

  constructor(
    @Optional() @Inject(IEventClient) private readonly client?: IEventClient,
    @Optional() @Inject(AUDIT_OPTIONS) filter?: AuditFilterOptions,
    @Optional() metrics?: MetricsService,
  ) {
    this.filter = resolveAuditFilter(filter ?? {});
    if (metrics) {
      // getSingleMetric first: repeated instantiations (tests, HMR) must not
      // register the same counter name into one shared registry
      this.eventsCounter =
        (metrics.registry.getSingleMetric('audit_events_total') as Counter<string> | undefined) ??
        metrics.counter('audit_events_total', 'Audit entries by filter result', ['result']);
    }
  }

  /** The filter silently shapes what the journal keeps, so it must be
   * visible at boot: one line with the resolved config plus warnings for
   * entries that look like typos. */
  onModuleInit(): void {
    for (const [kind, list] of [
      ['include', this.filter.include],
      ['exclude', this.filter.exclude],
    ] as const) {
      for (const prefix of list) {
        if (/[A-Z\s]/.test(prefix)) {
          this.logger.warn(
            `audit ${kind} prefix "${prefix}" contains whitespace/uppercase — likely a typo`,
          );
        }
      }
    }
    if (!this.filter.enabled) {
      this.logger.warn('audit disabled (AUDIT_ENABLED=false): no audit records are produced');
    }
    this.logger.log(
      `audit filter: enabled=${this.filter.enabled} ` +
        `include=[${this.filter.include.join(',')}] exclude=[${this.filter.exclude.join(',')}]`,
    );
  }

  log(entry: AuditEntry): void {
    if (!this.passesFilter(entry.action)) return;

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
    // audit noise must never compete with operational traffic in the event
    // bus claim queue: at equal priority a sustained audit flood (login
    // storms fire one audit per probe) starves real deliveries behind the
    // FIFO (journal 14, storm14 R2c). Demoted to the lowest claim rank.
    this.client
      .publish(AUDIT_EVENT_PATTERN, payload, { priority: 'low' })
      .catch((err: unknown) => {
        this.logger.error(
          `Failed to publish audit "${entry.action}": ${err instanceof Error ? err.message : err}`,
        );
      });
  }

  private passesFilter(action: string): boolean {
    if (!this.filter.enabled) {
      this.bump('disabled');
      return false;
    }
    if (
      this.filter.include.length > 0 &&
      !this.filter.include.some((prefix) => auditActionMatches(action, prefix))
    ) {
      this.bump('filtered');
      return false;
    }
    if (this.filter.exclude.some((prefix) => auditActionMatches(action, prefix))) {
      this.bump('filtered');
      return false;
    }
    this.bump('passed');
    return true;
  }

  private bump(result: 'passed' | 'filtered' | 'disabled'): void {
    this.eventsCounter?.inc({ result });
  }
}
