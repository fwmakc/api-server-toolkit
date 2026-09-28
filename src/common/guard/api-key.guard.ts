import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { timingSafeEqual } from "crypto";
import { API_ROLE } from "../access.rules";

/**
 * Доступ по статичному API-ключу — для внешних интеграций без JWT и аккаунта
 * (заказчики, партнёры) и для дев-стендов.
 *
 * Ключи задаются в env API_KEYS через запятую (генерация: openssl rand -hex 32).
 * Без API_KEYS guard fail-closed. Сравнение constant-time для каждого ключа.
 *
 * При успехе в request.user синтезируется роль 'api': маршруты под Access-моделью
 * открываются правилом { who: ['api'] }, собственные контроллеры могут проверять
 * роль напрямую.
 *
 * Использование: декоратор @ApiKey() на хендлере/контроллере либо UseGuards(ApiKeyGuard).
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const configured = (this.config.get<string>("API_KEYS") || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    if (!configured.length) {
      throw new UnauthorizedException("API_KEYS is not configured");
    }

    const providedKey = Buffer.from(String(request.headers?.["x-api-key"] ?? ""));
    const matched = configured.some((key) => {
      const expected = Buffer.from(key);
      return (
        providedKey.length === expected.length &&
        timingSafeEqual(providedKey, expected)
      );
    });

    if (!matched) {
      throw new UnauthorizedException("Invalid or missing X-Api-Key");
    }

    // Роль добавляется к существующей идентичности (JWT + ключ вместе);
    // сентинел id='api' — только когда аккаунта нет
    request.user = {
      ...(request.user || { id: "api" }),
      isApiKey: true,
      roles: [...(request.user?.roles || []), API_ROLE],
    };
    return true;
  }
}
