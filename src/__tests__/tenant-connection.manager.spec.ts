import { TenantConnectionManager } from '../common/service/tenant-connection.manager';

jest.mock('typeorm', () => {
  const mockInstances: any[] = [];
  return {
    DataSource: jest.fn().mockImplementation((opts: any) => {
      const instance = {
        isInitialized: false,
        initialize: jest.fn().mockImplementation(() => {
          instance.isInitialized = true;
          return Promise.resolve();
        }),
        destroy: jest.fn().mockResolvedValue(undefined),
        getRepository: jest.fn(),
        _opts: opts,
      };
      mockInstances.push(instance);
      return instance;
    }),
    DataSourceOptions: {},
  };
});

describe('TenantConnectionManager', () => {
  beforeEach(() => {
    (TenantConnectionManager as any).pool.clear();
    (TenantConnectionManager as any).options = null;
    (TenantConnectionManager as any).accessOrder = [];
  });

  it('get() throws if not initialized', async () => {
    await expect(TenantConnectionManager.get('t1')).rejects.toThrow(
      'TenantConnectionManager not initialized',
    );
  });

  it('init() + get() creates and caches DataSource', async () => {
    TenantConnectionManager.init({
      createConnection: (tenantId) => ({ type: 'postgres', database: `db_${tenantId}` }) as any,
    });
    const ds = await TenantConnectionManager.get('t1');
    expect(ds.isInitialized).toBe(true);
    expect((ds as any)._opts).toEqual({ type: 'postgres', database: 'db_t1' });
  });

  it('get() returns cached DataSource on second call', async () => {
    TenantConnectionManager.init({
      createConnection: (tenantId) => ({ type: 'postgres', database: `db_${tenantId}` }) as any,
    });
    const first = await TenantConnectionManager.get('t1');
    const second = await TenantConnectionManager.get('t1');
    expect(first).toBe(second);
  });

  it('close() destroys and removes a tenant connection', async () => {
    TenantConnectionManager.init({
      createConnection: (tenantId) => ({ type: 'postgres', database: `db_${tenantId}` }) as any,
    });
    const ds = await TenantConnectionManager.get('t1');
    expect(TenantConnectionManager.getSize()).toBe(1);
    await TenantConnectionManager.close('t1');
    expect(ds.destroy).toHaveBeenCalled();
    expect(TenantConnectionManager.getSize()).toBe(0);
  });

  it('closeAll() closes all connections', async () => {
    TenantConnectionManager.init({
      createConnection: (tenantId) => ({ type: 'postgres', database: `db_${tenantId}` }) as any,
    });
    const ds1 = await TenantConnectionManager.get('t1');
    const ds2 = await TenantConnectionManager.get('t2');
    expect(TenantConnectionManager.getSize()).toBe(2);
    await TenantConnectionManager.closeAll();
    expect(ds1.destroy).toHaveBeenCalled();
    expect(ds2.destroy).toHaveBeenCalled();
    expect(TenantConnectionManager.getSize()).toBe(0);
  });

  it('getSize() returns correct count', async () => {
    TenantConnectionManager.init({
      createConnection: (tenantId) => ({ type: 'postgres', database: `db_${tenantId}` }) as any,
    });
    expect(TenantConnectionManager.getSize()).toBe(0);
    await TenantConnectionManager.get('t1');
    expect(TenantConnectionManager.getSize()).toBe(1);
    await TenantConnectionManager.get('t2');
    expect(TenantConnectionManager.getSize()).toBe(2);
  });

  it('evicts oldest when pool reaches maxTotalConnections', async () => {
    TenantConnectionManager.init({
      createConnection: (tenantId) => ({ type: 'postgres', database: `db_${tenantId}` }) as any,
      maxTotalConnections: 2,
    });
    const ds1 = await TenantConnectionManager.get('t1');
    const ds2 = await TenantConnectionManager.get('t2');
    expect(TenantConnectionManager.getSize()).toBe(2);
    const ds3 = await TenantConnectionManager.get('t3');
    expect(ds1.destroy).toHaveBeenCalled();
    expect(TenantConnectionManager.getSize()).toBe(2);
    expect(ds3.isInitialized).toBe(true);
  });
});
