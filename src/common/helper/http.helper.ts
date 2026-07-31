export interface HttpOptions {
  headers?: Record<string, string>;
  timeout?: number;
  raw?: boolean;
}

export interface HttpResponse<T = any> {
  status: number;
  data: T;
  ok: boolean;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly data: any,
    message?: string,
  ) {
    super(message || `HTTP ${status}`);
    this.name = 'HttpError';
  }
}

async function request(
  method: string,
  url: string,
  body: unknown,
  options?: HttpOptions,
): Promise<HttpResponse> {
  const controller = new AbortController();
  const timeout = options?.timeout ?? 30000;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    let data: any = text;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {}
    }

    if (!options?.raw && !response.ok) {
      throw new HttpError(response.status, data);
    }

    return { status: response.status, data, ok: response.ok };
  } finally {
    clearTimeout(timer);
  }
}

export function httpPost(
  url: string,
  body?: unknown,
  options?: HttpOptions,
): Promise<HttpResponse> {
  return request('POST', url, body, options);
}

export function httpGet(
  url: string,
  options?: HttpOptions,
): Promise<HttpResponse> {
  return request('GET', url, undefined, options);
}
