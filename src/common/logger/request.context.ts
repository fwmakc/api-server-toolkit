import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

interface RequestContextStore {
  requestId: string;
}

const storage = new AsyncLocalStorage<RequestContextStore>();

/**
 * Express middleware that assigns every request a request id: honors an
 * incoming `X-Request-Id` (sanitized, capped at 128 chars) or generates a
 * UUID, echoes it back on the response, and exposes it to everything
 * running inside the request via AsyncLocalStorage.
 */
export function requestContextMiddleware(req: any, res: any, next: () => void): void {
  const incoming = req.headers?.[REQUEST_ID_HEADER];
  const requestId =
    typeof incoming === 'string' && incoming.trim()
      ? incoming.replace(/[^\w\-.]/g, '').slice(0, 128)
      : randomUUID();

  res.setHeader?.(REQUEST_ID_HEADER, requestId);
  storage.run({ requestId }, next);
}

/** Request id of the current execution context (undefined outside a request). */
export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}
