import { Module, DynamicModule } from '@nestjs/common';
import { TenantConnectionManager, TenantConnectionManagerOptions } from './tenant-connection.manager';

export interface TenantModuleOptions {
  strategy?: 'where' | 'schema' | 'database';
  schemaPrefix?: string;
  maxPoolPerTenant?: number;
  maxTotalConnections?: number;
  createConnection?: (tenantId: string) => any;
}

@Module({})
export class TenantModule {
  static forRoot(options?: TenantModuleOptions): DynamicModule {
    const opts = options || {};
    const strategy = opts.strategy || 'where';

    if (strategy === 'database') {
      if (!opts.createConnection) {
        throw new Error('TenantModule: createConnection is required for database strategy');
      }
      TenantConnectionManager.init({
        createConnection: opts.createConnection,
        maxPoolPerTenant: opts.maxPoolPerTenant,
        maxTotalConnections: opts.maxTotalConnections,
      });
    }

    return {
      module: TenantModule,
      exports: [TenantModule],
    };
  }
}
