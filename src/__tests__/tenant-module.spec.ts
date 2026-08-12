import { TenantModule } from '../common/service/tenant.module';

jest.mock('../common/service/tenant-connection.manager', () => ({
  TenantConnectionManager: {
    init: jest.fn(),
  },
}));

import { TenantConnectionManager } from '../common/service/tenant-connection.manager';

describe('TenantModule', () => {
  beforeEach(() => {
    (TenantConnectionManager.init as jest.Mock).mockClear();
  });

  it('forRoot() with no options returns module with TenantModule export', () => {
    const mod = TenantModule.forRoot();
    expect(mod.module).toBe(TenantModule);
    expect(mod.exports).toContain(TenantModule);
  });

  it('forRoot() with strategy where does not init TenantConnectionManager', () => {
    TenantModule.forRoot({ strategy: 'where' });
    expect(TenantConnectionManager.init).not.toHaveBeenCalled();
  });

  it('forRoot() with strategy database and createConnection inits TenantConnectionManager', () => {
    const createConnection = (tenantId: string) => ({ database: `db_${tenantId}` });
    TenantModule.forRoot({
      strategy: 'database',
      createConnection,
      maxTotalConnections: 50,
    });
    expect(TenantConnectionManager.init).toHaveBeenCalledWith({
      createConnection,
      maxTotalConnections: 50,
    });
  });

  it('forRoot() with strategy database without createConnection throws error', () => {
    expect(() => {
      TenantModule.forRoot({ strategy: 'database' });
    }).toThrow('createConnection is required for database strategy');
  });
});
