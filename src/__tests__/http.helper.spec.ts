import { httpGet, httpPost, HttpError, HttpResponse } from '../common/helper/http.helper';

describe('http.helper', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function mockFetch(opts: {
    ok?: boolean;
    status?: number;
    body?: string;
    delay?: number;
    headers?: Record<string, string>;
  }) {
    const { ok = true, status = 200, body = '{}', delay = 0, headers = {} } = opts;
    const jsonBody = typeof body === 'string' ? body : JSON.stringify(body);
    const response = {
      ok,
      status,
      text: async () => jsonBody,
      headers: {
        forEach: (cb: (value: string, key: string) => void) => {
          Object.entries(headers).forEach(([k, v]) => cb(v, k));
        },
      },
    } as any;
    global.fetch = jest.fn(async () => {
      if (delay) await new Promise((r) => setTimeout(r, delay));
      return response;
    }) as any;
  }

  describe('httpGet', () => {
    it('returns parsed JSON on success', async () => {
      mockFetch({ status: 200, body: '{"hello":"world"}' });
      const res = await httpGet('http://example.com/api');
      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);
      expect(res.data).toEqual({ hello: 'world' });
    });

    it('sends GET method', async () => {
      mockFetch({ status: 200, body: '{}' });
      await httpGet('http://example.com/api');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://example.com/api',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('does not send a body for GET', async () => {
      mockFetch({ status: 200, body: '{}' });
      await httpGet('http://example.com/api');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://example.com/api',
        expect.objectContaining({ body: undefined }),
      );
    });

    it('throws HttpError on non-ok status', async () => {
      mockFetch({ ok: false, status: 404, body: '{"error":"not found"}' });
      await expect(httpGet('http://example.com/404')).rejects.toThrow(HttpError);
    });

    it('returns response without throwing when raw=true', async () => {
      mockFetch({ ok: false, status: 500, body: '{"error":"oops"}' });
      const res = await httpGet('http://example.com/500', { raw: true });
      expect(res.status).toBe(500);
      expect(res.ok).toBe(false);
      expect(res.data).toEqual({ error: 'oops' });
    });

    it('handles non-JSON response body', async () => {
      mockFetch({ status: 200, body: 'plain text response' });
      const res = await httpGet('http://example.com/text');
      expect(res.data).toBe('plain text response');
    });

    it('handles empty response body', async () => {
      mockFetch({ status: 204, body: '' });
      const res = await httpGet('http://example.com/empty');
      expect(res.data).toBe('');
    });
  });

  describe('httpPost', () => {
    it('sends POST with JSON body', async () => {
      mockFetch({ status: 201, body: '{"id":1}' });
      const res = await httpPost('http://example.com/api', { name: 'test' });
      expect(res.status).toBe(201);
      expect(res.data).toEqual({ id: 1 });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://example.com/api',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        }),
      );
    });

    it('sets Content-Type to application/json by default', async () => {
      mockFetch({ status: 200, body: '{}' });
      await httpPost('http://example.com/api', { foo: 1 });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://example.com/api',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('allows overriding headers', async () => {
      mockFetch({ status: 200, body: '{}' });
      await httpPost('http://example.com/api', null, {
        headers: { 'X-Custom': 'yes' },
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://example.com/api',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom': 'yes',
          }),
        }),
      );
    });

    it('does not send body when undefined', async () => {
      mockFetch({ status: 200, body: '{}' });
      await httpPost('http://example.com/api');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://example.com/api',
        expect.objectContaining({ body: undefined }),
      );
    });

    it('throws HttpError with status and data on failure', async () => {
      mockFetch({ ok: false, status: 400, body: '{"error":"bad request"}' });
      try {
        await httpPost('http://example.com/api', {});
        fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpError);
        expect((e as HttpError).status).toBe(400);
        expect((e as HttpError).data).toEqual({ error: 'bad request' });
      }
    });
  });

  describe('HttpError', () => {
    it('sets name to HttpError', () => {
      const err = new HttpError(500, { detail: 'fail' });
      expect(err.name).toBe('HttpError');
    });

    it('defaults message to HTTP {status}', () => {
      const err = new HttpError(404, null);
      expect(err.message).toBe('HTTP 404');
    });

    it('uses custom message when provided', () => {
      const err = new HttpError(403, null, 'Forbidden resource');
      expect(err.message).toBe('Forbidden resource');
    });
  });
});
