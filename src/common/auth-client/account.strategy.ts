import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  ForbiddenException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { AuthClientService } from './auth-client.service';

@Injectable()
export class AccountStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authClientService: AuthClientService,
  ) {
    // JWT_ISSUER / JWT_AUDIENCE: when set, verification enforces the claims
    // (passport-jwt skips the check when the options are undefined — old
    // stacks without the env keep validating the old way). Must match the
    // auth-server signing options; roll out stack-wide in one deploy.
    const issuer = configService.get<string>('JWT_ISSUER');
    const audience = configService.get<string>('JWT_AUDIENCE');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        jwksUri: `${configService.get('AUTH_SERVER_URL')}/.well-known/jwks.json`,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
      }),
      algorithms: ['RS256'],
      ...(issuer ? { issuer } : {}),
      ...(audience ? { audience } : {}),
    });
  }

  async validate({ id, type, key }: { id: number | string; type: string; key?: string }) {
    if (!type || type !== 'access') {
      throw new UnauthorizedException('Invalid token or expired!');
    }
    const account = await this.authClientService.getAccountInfo(Number(id));
    if (!account || (!account.isActivated && !key)) {
      throw new ForbiddenException('You have no rights!');
    }
    return account;
  }
}
