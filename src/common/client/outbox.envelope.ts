import { OutboxOptions } from './outbox.entity';

/**
 * The wire envelope POSTed to event-server /events — identical to what
 * HttpEventClient sends, so event-server cannot tell an outbox delivery
 * from a direct one. Single source of truth for both the client (what to
 * persist) and the relay (what to send).
 */
export function buildEventEnvelope(
  pattern: string,
  payload: Record<string, unknown>,
  source: string | null | undefined,
  opts: OutboxOptions | null | undefined,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    pattern,
    payload,
    source: source || undefined,
    broadcast: opts?.broadcast ?? true,
    priority: opts?.priority || 'normal',
  };
  if (opts?.delay) body.delay = opts.delay;
  if (opts?.log !== undefined) body.log = opts.log;
  if (opts?.ttl) body.ttl = opts.ttl;
  return body;
}
