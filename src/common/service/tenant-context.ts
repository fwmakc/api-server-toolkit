import { AsyncLocalStorage } from 'async_hooks';
import { DataSource, QueryRunner } from 'typeorm';

interface TenantStore {
  tenantId: string;
  queryRunner?: QueryRunner;
  dataSource?: DataSource;
}

export class TenantContext {
  private static storage = new AsyncLocalStorage<TenantStore>();

  static run<T>(tenantId: string, fn: () => T): T {
    return this.storage.run({ tenantId }, fn);
  }

  static getTenantId(): string | undefined {
    const store = this.storage.getStore();
    return store?.tenantId;
  }

  static setQueryRunner(qr: QueryRunner): void {
    const store = this.storage.getStore();
    if (store) store.queryRunner = qr;
  }

  static getQueryRunner(): QueryRunner | undefined {
    const store = this.storage.getStore();
    return store?.queryRunner;
  }

  static setDataSource(ds: DataSource): void {
    const store = this.storage.getStore();
    if (store) store.dataSource = ds;
  }

  static getDataSource(): DataSource | undefined {
    const store = this.storage.getStore();
    return store?.dataSource;
  }
}
