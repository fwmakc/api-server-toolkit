import { NestMiddleware } from '@nestjs/common';
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

  use(req: any, res: Response, next: NextFunction): void {
    const user = req.user as AccountInfo | undefined;
    const tenantId = user?.tenantId;

    if (!tenantId) {
      // schema/database стратегии без пользователя — это mis-wiring (гард не
      // успел: Nest-middleware запускается до паспортных гардов). Молча
      // продолжить значило бы работать без изоляции; громко падаем.
      next(
        new Error(
          'TenantMiddleware requires req.user (tenantId): wire it as express ' +
            'middleware AFTER passport initialization, not via module configure()',
        ),
      );
      return;
    }

    const tenantIdStr = String(tenantId);
    if (!/^\d+$/.test(tenantIdStr)) {
      next(new Error(`Invalid tenantId: ${tenantIdStr}`));
      return;
    }

    if (this.options.strategy === 'schema') {
      this.handleSchema(req, res, tenantIdStr, next);
    } else if (this.options.strategy === 'database') {
      this.handleDatabase(tenantIdStr, next);
    } else {
      next();
    }
  }

  private handleSchema(req: Request, res: Response, tenantIdStr: string, next: NextFunction): void {
    if (!this.dataSource) {
      next();
      return;
    }
    const prefix = this.options.schemaPrefix || 'tenant_';
    const qr = this.dataSource.createQueryRunner();
    // идентификатор в кавычках: tenantId уже проверен на ^\d+$
    qr.query(`SET search_path TO "${prefix}${tenantIdStr}"`).then(() => {
      // освобождаем коннект в пул, когда ответ ушёл/клиент ушёл — прежде
      // runner жил вечно и исчерпывал пул за N запросов
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        qr.release();
      };
      res.once('finish', release);
      res.once('close', release);
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
