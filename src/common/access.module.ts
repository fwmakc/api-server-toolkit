import {
  DynamicModule,
  Inject,
  Injectable,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { validateAccessRegistry } from './access.validator';

@Injectable()
export class AccessValidationService implements OnModuleInit {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  onModuleInit(): void {
    validateAccessRegistry(this.dataSource);
  }
}

/**
 * Подключается в AppModule после TypeOrmModule: на старте валидирует
 * все конфиги доступа (AccessRule) против метаданных сущностей.
 * Ошибка конфигурации = сервис не поднимается.
 */
@Module({})
export class AccessModule {
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: AccessModule,
      providers: [AccessValidationService],
      exports: [AccessValidationService],
    };
  }
}
