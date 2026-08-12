import { TenantContext } from '../common/service/tenant-context';

describe('TenantContext', () => {
  const mockQueryRunner = { manager: { getRepository: jest.fn() } } as any;
  const mockDataSource = { isInitialized: true, getRepository: jest.fn(), destroy: jest.fn() } as any;

  it('getTenantId() returns undefined outside of run()', () => {
    expect(TenantContext.getTenantId()).toBeUndefined();
  });

  it('run() sets tenantId accessible via getTenantId()', () => {
    const result = TenantContext.run('tenant-1', () => {
      return TenantContext.getTenantId();
    });
    expect(result).toBe('tenant-1');
  });

  it('nested run() overrides tenantId', () => {
    const result = TenantContext.run('outer', () => {
      const outer = TenantContext.getTenantId();
      const inner = TenantContext.run('inner', () => {
        return TenantContext.getTenantId();
      });
      return { outer, inner };
    });
    expect(result.outer).toBe('outer');
    expect(result.inner).toBe('inner');
  });

  it('getQueryRunner() returns undefined by default', () => {
    TenantContext.run('t1', () => {
      expect(TenantContext.getQueryRunner()).toBeUndefined();
    });
  });

  it('setQueryRunner() stores qr accessible via getQueryRunner()', () => {
    TenantContext.run('t1', () => {
      TenantContext.setQueryRunner(mockQueryRunner);
      expect(TenantContext.getQueryRunner()).toBe(mockQueryRunner);
    });
  });

  it('getDataSource() returns undefined by default', () => {
    TenantContext.run('t1', () => {
      expect(TenantContext.getDataSource()).toBeUndefined();
    });
  });

  it('setDataSource() stores ds accessible via getDataSource()', () => {
    TenantContext.run('t1', () => {
      TenantContext.setDataSource(mockDataSource);
      expect(TenantContext.getDataSource()).toBe(mockDataSource);
    });
  });

  it('all context is cleared after run() completes', () => {
    TenantContext.run('t1', () => {
      TenantContext.setQueryRunner(mockQueryRunner);
      TenantContext.setDataSource(mockDataSource);
    });
    expect(TenantContext.getTenantId()).toBeUndefined();
    expect(TenantContext.getQueryRunner()).toBeUndefined();
    expect(TenantContext.getDataSource()).toBeUndefined();
  });
});
