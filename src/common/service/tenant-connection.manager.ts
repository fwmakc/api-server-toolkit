import { DataSource, DataSourceOptions } from 'typeorm';

export interface TenantConnectionManagerOptions {
  createConnection: (tenantId: string) => DataSourceOptions;
  maxPoolPerTenant?: number;
  maxTotalConnections?: number;
}

export class TenantConnectionManager {
  private static pool = new Map<string, DataSource>();
  private static options: TenantConnectionManagerOptions | null = null;
  private static accessOrder: string[] = [];

  static init(options: TenantConnectionManagerOptions): void {
    TenantConnectionManager.options = options;
  }

  static async get(tenantId: string): Promise<DataSource> {
    if (!TenantConnectionManager.options) {
      throw new Error('TenantConnectionManager not initialized. Call init() first.');
    }

    const existing = TenantConnectionManager.pool.get(tenantId);
    if (existing && existing.isInitialized) {
      TenantConnectionManager.touchAccess(tenantId);
      return existing;
    }

    const maxTotal = TenantConnectionManager.options.maxTotalConnections || 100;
    if (TenantConnectionManager.pool.size >= maxTotal) {
      await TenantConnectionManager.evictOldest();
    }

    const opts = TenantConnectionManager.options.createConnection(tenantId);
    const ds = new DataSource(opts);
    await ds.initialize();
    TenantConnectionManager.pool.set(tenantId, ds);
    TenantConnectionManager.accessOrder.push(tenantId);
    return ds;
  }

  static async close(tenantId: string): Promise<void> {
    const ds = TenantConnectionManager.pool.get(tenantId);
    if (ds && ds.isInitialized) {
      await ds.destroy();
    }
    TenantConnectionManager.pool.delete(tenantId);
    TenantConnectionManager.accessOrder = TenantConnectionManager.accessOrder.filter(
      (id) => id !== tenantId,
    );
  }

  static async closeAll(): Promise<void> {
    const promises = [];
    for (const [tenantId] of TenantConnectionManager.pool) {
      promises.push(TenantConnectionManager.close(tenantId));
    }
    await Promise.all(promises);
  }

  static getSize(): number {
    return TenantConnectionManager.pool.size;
  }

  private static touchAccess(tenantId: string): void {
    TenantConnectionManager.accessOrder = TenantConnectionManager.accessOrder.filter(
      (id) => id !== tenantId,
    );
    TenantConnectionManager.accessOrder.push(tenantId);
  }

  private static async evictOldest(): Promise<void> {
    const oldest = TenantConnectionManager.accessOrder[0];
    if (oldest) {
      await TenantConnectionManager.close(oldest);
    }
  }
}
