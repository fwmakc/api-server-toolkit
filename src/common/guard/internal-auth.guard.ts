import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { timingSafeEqual } from "crypto";

@Injectable()
export class InternalAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-internal-api-key"];
    const expected = this.config.get<string>("INTERNAL_API_KEY");

    if (!expected) {
      throw new UnauthorizedException("INTERNAL_API_KEY is not configured");
    }

    const provided = Buffer.from(String(apiKey ?? ""));
    const expectedKey = Buffer.from(expected);
    if (
      provided.length !== expectedKey.length ||
      !timingSafeEqual(provided, expectedKey)
    ) {
      throw new UnauthorizedException("Invalid or missing X-Internal-Api-Key");
    }

    return true;
  }
}
