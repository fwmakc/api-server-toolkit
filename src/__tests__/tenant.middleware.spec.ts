import { TenantMiddleware } from '../common/service/tenant.middleware';

jest.mock('../common/service/tenant-connection.manager', () => ({
  TenantConnectionManager: {
    get: jest.fn().mockResolvedValue({ isInitialized: true, getRepository: jest.fn() }),
  },
}));

describe('TenantMiddleware', () => {
  let mockQr: any;
  let mockDataSource: any;

  beforeEach(() => {
    mockQr = {
      query: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
    };
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQr),
    };
  });

  // Wave 6: without a user the middleware used to silently continue with no
  // isolation — now it fails loud (mis-wired middleware is a boot-level bug)
  it('fails loud when no user on request under a non-where strategy', () => {
    const middleware = new TenantMiddleware({ strategy: 'schema' });
    const req: any = { user: undefined };
    const res: any = {};
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].message).toMatch(/req\.user/);
  });

  it('fails loud when user has no tenantId under a non-where strategy', () => {
    const middleware = new TenantMiddleware({ strategy: 'schema' });
    const req: any = { user: { tenantId: undefined } };
    const res: any = {};
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('rejects a non-numeric tenantId', () => {
    const middleware = new TenantMiddleware({ strategy: 'schema' }, mockDataSource);
    const req: any = { user: { tenantId: "42; DROP SCHEMA x" } };
    const res: any = {};
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(mockDataSource.createQueryRunner).not.toHaveBeenCalled();
  });

  it('for schema strategy: creates QueryRunner, sets search_path, calls next()', (done) => {
    const middleware = new TenantMiddleware({ strategy: 'schema' }, mockDataSource);
    const req: any = { user: { tenantId: 42 } };
    const res: any = { once: jest.fn() };
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(mockDataSource.createQueryRunner).toHaveBeenCalled();

    setTimeout(() => {
      // identifier is quoted (Wave 6)
      expect(mockQr.query).toHaveBeenCalledWith('SET search_path TO "tenant_42"');
      expect(next).toHaveBeenCalledWith();
      expect(req['tenantQueryRunner']).toBe(mockQr);
      // the runner is released when the response finishes (no pool leak)
      expect(res.once).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(res.once).toHaveBeenCalledWith('close', expect.any(Function));
      done();
    }, 10);
  });

  it('for database strategy: gets connection from TenantConnectionManager, calls next()', (done) => {
    const middleware = new TenantMiddleware({ strategy: 'database' });
    const req: any = { user: { tenantId: 42 } };
    const res: any = {};
    const next = jest.fn();

    middleware.use(req, res, next);

    setTimeout(() => {
      expect(next).toHaveBeenCalledWith();
      done();
    }, 10);
  });

  it('for where strategy: just calls next()', () => {
    const middleware = new TenantMiddleware({ strategy: 'where' } as any);
    const req: any = { user: { tenantId: 42 } };
    const res: any = {};
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });
});
