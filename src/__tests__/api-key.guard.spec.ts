import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiKeyGuard } from "../common/guard/api-key.guard";
import { API_ROLE } from "../common/access.rules";

describe("ApiKeyGuard", () => {
  let config: { get: jest.Mock };

  const makeGuard = () =>
    new ApiKeyGuard({ get: config.get } as unknown as ConfigService);

  const makeContext = (headers: Record<string, string> = {}) => {
    const request: any = { headers, user: undefined };
    return {
      request,
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;
  };

  beforeEach(() => {
    config = { get: jest.fn().mockReturnValue("key-one, key-two") };
  });

  it("accepts a configured key and synthesizes the api role", () => {
    const ctx = makeContext({ "x-api-key": "key-one" });

    expect(makeGuard().canActivate(ctx)).toBe(true);
    expect(ctx.request.user).toEqual({
      id: "api",
      isApiKey: true,
      roles: [API_ROLE],
    });
  });

  it("accepts any of the configured keys (trimmed)", () => {
    expect(
      makeGuard().canActivate(makeContext({ "x-api-key": "key-two" }))
    ).toBe(true);
  });

  it("preserves existing roles when request.user is already set", () => {
    const ctx = makeContext({ "x-api-key": "key-one" });
    ctx.request.user = { id: 7, roles: ["authenticated"] };

    makeGuard().canActivate(ctx);

    expect(ctx.request.user.roles).toEqual(["authenticated", API_ROLE]);
    expect(ctx.request.user.id).toBe(7);
  });

  it("rejects an unknown key", () => {
    const ctx = makeContext({ "x-api-key": "wrong" });

    expect(() => makeGuard().canActivate(ctx)).toThrow(UnauthorizedException);
    expect(() => makeGuard().canActivate(ctx)).toThrow("Invalid or missing");
  });

  it("rejects a key that is a prefix or extension of a configured key", () => {
    config.get.mockReturnValue("secret-key-123");

    expect(() =>
      makeGuard().canActivate(makeContext({ "x-api-key": "secret-key" }))
    ).toThrow("Invalid or missing");
    expect(() =>
      makeGuard().canActivate(makeContext({ "x-api-key": "secret-key-1234" }))
    ).toThrow("Invalid or missing");
  });

  it("rejects a missing header", () => {
    expect(() => makeGuard().canActivate(makeContext())).toThrow(
      "Invalid or missing"
    );
  });

  it("is fail-closed without API_KEYS configuration", () => {
    config.get.mockReturnValue(undefined);
    const ctx = makeContext({ "x-api-key": "key-one" });

    expect(() => makeGuard().canActivate(ctx)).toThrow(
      "API_KEYS is not configured"
    );
  });

  it("is fail-closed on empty API_KEYS", () => {
    config.get.mockReturnValue(" , ");
    const ctx = makeContext({ "x-api-key": "key-one" });

    expect(() => makeGuard().canActivate(ctx)).toThrow(
      "API_KEYS is not configured"
    );
  });
});
