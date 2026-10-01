import "reflect-metadata";
import { UnauthorizedException } from "@nestjs/common";
import { signEventDelivery, generateWebhookSecret } from "../common/helper/webhook-signature.helper";
import { EventDeliveryGuard } from "../common/guard/event-delivery.guard";

const buildContext = (headers: Record<string, string>, rawBody?: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers, rawBody: Buffer.from(rawBody ?? "") }),
    }),
  }) as any;

const buildGuard = (config: Record<string, string>) =>
  new EventDeliveryGuard({ get: (key: string) => config[key] } as any);

describe("EventDeliveryGuard", () => {
  const secret = generateWebhookSecret();
  const body = JSON.stringify({ eventId: 7, pattern: "user.confirmed" });
  const ts = String(Math.floor(Date.now() / 1000));

  it("signature mode: accepts a valid signed delivery", () => {
    const guard = buildGuard({ WEBHOOK_SECRET: secret });
    const signature = signEventDelivery(secret, Number(ts), body);
    expect(
      guard.canActivate(
        buildContext(
          {
            "x-event-signature": signature,
            "x-event-timestamp": ts,
          },
          body,
        ),
      ),
    ).toBe(true);
  });

  it("signature mode: rejects a missing or forged signature", () => {
    const guard = buildGuard({ WEBHOOK_SECRET: secret });
    expect(() =>
      guard.canActivate(buildContext({ "x-event-timestamp": ts }, body)),
    ).toThrow(UnauthorizedException);
    expect(() =>
      guard.canActivate(
        buildContext(
          {
            "x-event-signature": signEventDelivery(generateWebhookSecret(), Number(ts), body),
            "x-event-timestamp": ts,
          },
          body,
        ),
      ),
    ).toThrow(UnauthorizedException);
    // replay: signature from an older timestamp is inside signature, but the
    // attacker also replays the old timestamp header — freshness window catches it
    const oldTs = String(Math.floor(Date.now() / 1000) - 4000);
    expect(() =>
      guard.canActivate(
        buildContext(
          {
            "x-event-signature": signEventDelivery(secret, Number(oldTs), body),
            "x-event-timestamp": oldTs,
          },
          body,
        ),
      ),
    ).toThrow(UnauthorizedException);
  });

  it("legacy mode (no WEBHOOK_SECRET): checks the shared internal key", () => {
    const guard = buildGuard({ INTERNAL_API_KEY: "k" });
    expect(guard.canActivate(buildContext({ "x-internal-api-key": "k" }, body))).toBe(true);
    expect(() => guard.canActivate(buildContext({}, body))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(buildContext({ "x-internal-api-key": "wrong" }, body))).toThrow(
      UnauthorizedException,
    );
  });

  it("legacy mode: fails closed without INTERNAL_API_KEY configured", () => {
    const guard = buildGuard({});
    expect(() => guard.canActivate(buildContext({}, body))).toThrow(/not configured/);
  });
});
