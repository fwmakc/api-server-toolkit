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

  it('calls next() immediately when no user on request', () => {
    const middleware = new TenantMiddleware({ strategy: 'schema' });
    const req: any = { user: undefined };
    const res: any = {};
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() immediately when user has no tenantId', () => {
    const middleware = new TenantMiddleware({ strategy: 'schema' });
    const req: any = { user: { tenantId: undefined } };
    const res: any = {};
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('for schema strategy: creates QueryRunner, sets search_path, calls next()', (done) => {
    const middleware = new TenantMiddleware({ strategy: 'schema' }, mockDataSource);
    const req: any = { user: { tenantId: 42 } };
    const res: any = {};
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(mockDataSource.createQueryRunner).toHaveBeenCalled();

    setTimeout(() => {
      expect(mockQr.query).toHaveBeenCalledWith('SET search_path TO tenant_42');
      expect(next).toHaveBeenCalledWith();
      expect(req['tenantQueryRunner']).toBe(mockQr);
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
