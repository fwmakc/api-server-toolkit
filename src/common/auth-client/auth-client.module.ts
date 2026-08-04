import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthClientService } from './auth-client.service';
import { AccountStrategy } from './account.strategy';

@Module({})
export class AuthClientModule {
  static forRoot(): DynamicModule {
    return {
      module: AuthClientModule,
      imports: [ConfigModule, PassportModule],
      providers: [AuthClientService, AccountStrategy],
      exports: [AuthClientService, PassportModule],
    };
  }
}
