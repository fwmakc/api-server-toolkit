import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { timingSafeEqual } from "crypto";
import {
  verifyEventDelivery,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
  DEFAULT_TIMESTAMP_TOLERANCE_SECONDS,
} from "../helper/webhook-signature.helper";

/**
 * Guard for event-bus receiver routes (POST /webhooks/events and friends).
 *
 * With `WEBHOOK_SECRET` set (per-subscriber secret, recommended): requires a
 * valid `X-Event-Signature` HMAC + fresh `X-Event-Timestamp` over the raw
 * request body — the shared X-Internal-Api-Key is NOT accepted on this route.
 * Requires `rawBody: true` in NestFactory.create so `request.rawBody` holds
 * the exact bytes that were signed.
 *
 * Without `WEBHOOK_SECRET`: falls back to the legacy shared-key check, so
 * existing deployments keep working until they provision a secret.
 */
@Injectable()
export class EventDeliveryGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const secret = this.config.get<string>("WEBHOOK_SECRET");
    if (secret) {
      const rawBody: string =
        request.rawBody?.toString?.() ?? (typeof request.rawBody === "string" ? request.rawBody : "");
      const ok = verifyEventDelivery(
        secret,
        rawBody,
        request.headers[WEBHOOK_SIGNATURE_HEADER],
        request.headers[WEBHOOK_TIMESTAMP_HEADER],
        Number(
          this.config.get("WEBHOOK_TIMESTAMP_TOLERANCE") ??
            DEFAULT_TIMESTAMP_TOLERANCE_SECONDS,
        ),
      );
      if (!ok) {
        throw new UnauthorizedException("Invalid event signature or timestamp");
      }
      return true;
    }

    // Legacy mode: shared internal key (same check as InternalAuthGuard)
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
