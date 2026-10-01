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
    const current = this.config.get<string>("INTERNAL_API_KEY");

    if (!current) {
      throw new UnauthorizedException("INTERNAL_API_KEY is not configured");
    }

    // Rotation window: INTERNAL_API_KEY_PREVIOUS (comma-separated) stays
    // valid alongside the current key until every caller has been switched.
    const previous = (this.config.get<string>("INTERNAL_API_KEY_PREVIOUS") || "")
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean);

    const providedKey = Buffer.from(String(apiKey ?? ""));
    const matched = [current, ...previous].some((key) => {
      const expected = Buffer.from(key);
      return (
        providedKey.length === expected.length &&
        timingSafeEqual(providedKey, expected)
      );
    });

    if (!matched) {
      throw new UnauthorizedException("Invalid or missing X-Internal-Api-Key");
    }

    return true;
  }
}
