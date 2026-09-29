const mockHttpGet = jest.fn();

jest.mock('../common/helper/http.helper', () => ({
  httpGet: (...args: unknown[]) => mockHttpGet(...args),
}));

import { AuthClientService } from '../common/auth-client/auth-client.service';

describe('AuthClientService', () => {
  const envBackup = { ...process.env };
  const account = (id: number) => ({
    id,
    username: `user${id}@test.io`,
    isActivated: true,
    isSuperuser: false,
    roles: ['authenticated'],
    roleEntries: [],
  });

  const makeService = () =>
    new AuthClientService({
      get: (key: string) =>
        ({
          AUTH_SERVER_URL: 'http://auth-test',
          INTERNAL_API_KEY: 'test-key',
        })[key],
    } as any);

  beforeEach(() => {
    mockHttpGet.mockReset();
    delete process.env.AUTH_CACHE_TTL;
    delete process.env.AUTH_CACHE_MAX;
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('caches account info within the TTL (single fetch)', async () => {
    mockHttpGet.mockResolvedValue({
      data: account(1),
      headers: { 'cache-control': 'max-age=60' },
    });
    const service = makeService();

    expect(await service.getAccountInfo(1)).toEqual(account(1));
    expect(await service.getAccountInfo(1)).toEqual(account(1));

    expect(mockHttpGet).toHaveBeenCalledTimes(1);
  });

  it('refetches after the Cache-Control max-age expires', async () => {
    mockHttpGet.mockResolvedValue({
      data: account(1),
      headers: { 'cache-control': 'max-age=1' },
    });
    const service = makeService();

    await service.getAccountInfo(1);
    await new Promise((r) => setTimeout(r, 1100));
    await service.getAccountInfo(1);

    expect(mockHttpGet).toHaveBeenCalledTimes(2);
  });

  it('falls back to AUTH_CACHE_TTL when the header is missing', async () => {
    process.env.AUTH_CACHE_TTL = '1';
    mockHttpGet.mockResolvedValue({ data: account(2), headers: {} });
    const service = makeService();

    await service.getAccountInfo(2);
    await new Promise((r) => setTimeout(r, 15));
    await service.getAccountInfo(2);

    expect(mockHttpGet).toHaveBeenCalledTimes(2);
  });

  it('evicts the least recently used entry beyond AUTH_CACHE_MAX', async () => {
    process.env.AUTH_CACHE_MAX = '2';
    mockHttpGet.mockImplementation(async ({ raw }) => {
      void raw;
      return { data: account(0), headers: {} };
    });
    const service = makeService();

    // URL определяет, какой аккаунт вернулся — мок по id в пути
    mockHttpGet.mockImplementation(((url: string) =>
      Promise.resolve({
        data: account(Number(url.split('/').pop())),
        headers: {},
      })) as any);

    await service.getAccountInfo(1);
    await service.getAccountInfo(2);
    await service.getAccountInfo(3); // вытесняет id 1

    mockHttpGet.mockClear();
    await service.getAccountInfo(3); // в кэше
    await service.getAccountInfo(1); // вытеснен — рефетч

    expect(mockHttpGet).toHaveBeenCalledTimes(1);
    expect(mockHttpGet.mock.calls[0][0]).toContain('/info/1');
  });

  it('touches recency on cache hits (used entry survives eviction)', async () => {
    process.env.AUTH_CACHE_MAX = '2';
    mockHttpGet.mockImplementation(((url: string) =>
      Promise.resolve({
        data: account(Number(url.split('/').pop())),
        headers: {},
      })) as any);
    const service = makeService();

    await service.getAccountInfo(1);
    await service.getAccountInfo(2);
    await service.getAccountInfo(1); // touch — теперь 2 самый старый
    await service.getAccountInfo(3); // вытесняет id 2

    mockHttpGet.mockClear();
    await service.getAccountInfo(1);
    expect(mockHttpGet).not.toHaveBeenCalled();
  });

  it('clearCache(id) drops one entry, clearCache() drops all', async () => {
    mockHttpGet.mockResolvedValue({ data: account(1), headers: {} });
    const service = makeService();

    await service.getAccountInfo(1);
    service.clearCache(1);
    await service.getAccountInfo(1);
    expect(mockHttpGet).toHaveBeenCalledTimes(2);

    service.clearCache();
    await service.getAccountInfo(1);
    expect(mockHttpGet).toHaveBeenCalledTimes(3);
  });

  it('returns null and does not cache on fetch failure', async () => {
    mockHttpGet.mockRejectedValue(new Error('network down'));
    const service = makeService();

    expect(await service.getAccountInfo(7)).toBeNull();
    expect(await service.getAccountInfo(7)).toBeNull();
    expect(mockHttpGet).toHaveBeenCalledTimes(2);
  });
});
