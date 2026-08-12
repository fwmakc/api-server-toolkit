import { NestMiddleware, MiddlewareConsumer } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { TenantContext } from './tenant-context';
import { TenantConnectionManager } from './tenant-connection.manager';
import { AccountInfo } from '../access.type';

export interface TenantMiddlewareOptions {
  strategy: 'schema' | 'database';
  schemaPrefix?: string;
}

export class TenantMiddleware implements NestMiddleware {
  private options: TenantMiddlewareOptions;

  constructor(
    options: TenantMiddlewareOptions,
    private dataSource?: DataSource,
  ) {
    this.options = options;
  }

  use(req: any, _res: Response, next: NextFunction): void {
    const user = req.user as AccountInfo | undefined;
    const tenantId = user?.tenantId;

    if (!tenantId) {
      next();
      return;
    }

    const tenantIdStr = String(tenantId);

    if (this.options.strategy === 'schema') {
      this.handleSchema(req, tenantIdStr, next);
    } else if (this.options.strategy === 'database') {
      this.handleDatabase(tenantIdStr, next);
    } else {
      next();
    }
  }

  private handleSchema(req: Request, tenantIdStr: string, next: NextFunction): void {
    if (!this.dataSource) {
      next();
      return;
    }
    const prefix = this.options.schemaPrefix || 'tenant_';
    const qr = this.dataSource.createQueryRunner();
    qr.query(`SET search_path TO ${prefix}${tenantIdStr}`).then(() => {
      TenantContext.run(tenantIdStr, () => {
        TenantContext.setQueryRunner(qr);
        req['tenantQueryRunner'] = qr;
        next();
      });
    }).catch((e) => {
      qr.release();
      next(e);
    });
  }

  private handleDatabase(tenantIdStr: string, next: NextFunction): void {
    TenantConnectionManager.get(tenantIdStr).then((ds) => {
      TenantContext.run(tenantIdStr, () => {
        TenantContext.setDataSource(ds);
        next();
      });
    }).catch((e) => {
      next(e);
    });
  }
}
