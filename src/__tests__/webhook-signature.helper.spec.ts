import {
  DEFAULT_TIMESTAMP_TOLERANCE_SECONDS,
  generateWebhookSecret,
  signEventDelivery,
  validateWebhookEgress,
  verifyEventDelivery,
  WEBHOOK_SIGNATURE_HEADER,
} from "../common/helper/webhook-signature.helper";

describe("sign/verify event delivery", () => {
  const secret = generateWebhookSecret();
  const rawBody = JSON.stringify({ eventId: 1, pattern: "user.registered" });

  it("generates a 64-char hex secret (32 bytes)", () => {
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
  });

  it("verifies a signature it produced", () => {
    const ts = Math.floor(Date.now() / 1000);
    const signature = signEventDelivery(secret, ts, rawBody);
    expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/);
    expect(
      verifyEventDelivery(secret, rawBody, signature, String(ts)),
    ).toBe(true);
  });

  it("rejects a tampered body, wrong secret, or wrong scheme", () => {
    const ts = Math.floor(Date.now() / 1000);
    const signature = signEventDelivery(secret, ts, rawBody);
    expect(
      verifyEventDelivery(secret, rawBody + " ", signature, String(ts)),
    ).toBe(false);
    expect(
      verifyEventDelivery(generateWebhookSecret(), rawBody, signature, String(ts)),
    ).toBe(false);
    expect(
      verifyEventDelivery(secret, rawBody, "md5=deadbeef", String(ts)),
    ).toBe(false);
  });

  it("rejects missing parts", () => {
    const ts = Math.floor(Date.now() / 1000);
    const signature = signEventDelivery(secret, ts, rawBody);
    expect(verifyEventDelivery("", rawBody, signature, String(ts))).toBe(false);
    expect(verifyEventDelivery(secret, rawBody, undefined, String(ts))).toBe(false);
    expect(verifyEventDelivery(secret, rawBody, signature, undefined)).toBe(false);
    expect(verifyEventDelivery(secret, "", signature, String(ts))).toBe(false);
    expect(verifyEventDelivery(secret, rawBody, signature, "not-a-number")).toBe(false);
  });

  it("rejects replays outside the freshness window, accepts inside it", () => {
    const tolerance = DEFAULT_TIMESTAMP_TOLERANCE_SECONDS;
    const fresh = Math.floor(Date.now() / 1000);
    const stale = fresh - tolerance - 10;

    expect(
      verifyEventDelivery(secret, rawBody, signEventDelivery(secret, fresh, rawBody), String(fresh)),
    ).toBe(true);
    expect(
      verifyEventDelivery(secret, rawBody, signEventDelivery(secret, stale, rawBody), String(stale)),
    ).toBe(false);
    // custom tolerance
    expect(
      verifyEventDelivery(secret, rawBody, signEventDelivery(secret, stale, rawBody), String(stale), 3600),
    ).toBe(true);
  });
});

describe("validateWebhookEgress", () => {
  it("internal mode allows anything http(s)", () => {
    expect(validateWebhookEgress("http://message-server:3003/webhooks/events", "internal").ok).toBe(true);
    expect(validateWebhookEgress("http://169.254.169.254/latest/meta-data", "internal").ok).toBe(true);
  });

  it("always rejects non-http schemes and malformed URLs", () => {
    for (const mode of ["internal", "public", "allowlist"] as const) {
      expect(validateWebhookEgress("file:///etc/passwd", mode).ok).toBe(false);
      expect(validateWebhookEgress("gopher://x", mode).ok).toBe(false);
      expect(validateWebhookEgress("not a url", mode).ok).toBe(false);
    }
  });

  it("public mode blocks private, loopback, link-local and metadata targets", () => {
    const blocked = [
      "http://127.0.0.1/x",
      "http://10.1.2.3/x",
      "http://172.16.0.9/x",
      "http://192.168.1.1/x",
      "http://169.254.169.254/latest/meta-data",
      "http://100.64.0.1/x",
      "http://[::1]/x",
      "http://[::ffff:10.0.0.1]/x",
      "http://[fd00::1]/x",
      "http://[fe80::1]/x",
      "http://my-service.local/x",
      "http://0.0.0.0/x",
      "http://224.0.0.1/x",
    ];
    for (const url of blocked) {
      expect(validateWebhookEgress(url, "public").ok).toBe(false);
    }
  });

  it("public mode allows real public hosts and public IPs", () => {
    expect(validateWebhookEgress("https://hooks.example.com/x", "public").ok).toBe(true);
    expect(validateWebhookEgress("http://8.8.8.8/x", "public").ok).toBe(true);
    // TEST-NET documentation ranges stay blocked
    expect(validateWebhookEgress("http://203.0.113.10/x", "public").ok).toBe(false);
  });

  it("allowlist mode pins exact hostnames", () => {
    const allow = ["message-server", "MyService.internal"];
    expect(validateWebhookEgress("http://message-server:3003/x", "allowlist", allow).ok).toBe(true);
    expect(validateWebhookEgress("http://MYSERVICE.INTERNAL/x", "allowlist", allow).ok).toBe(true);
    expect(validateWebhookEgress("http://evil.example.com/x", "allowlist", allow).ok).toBe(false);
  });

  it("normalizes trailing-dot hostnames (DNS root form)", () => {
    // `localhost.` and `127.0.0.1.` previously slipped past the filters:
    // the trailing dot defeated both the "no dot" rule and the IP parse.
    expect(validateWebhookEgress("http://localhost./x", "public").ok).toBe(false);
    expect(validateWebhookEgress("http://127.0.0.1./x", "public").ok).toBe(false);
    expect(validateWebhookEgress("http://10.0.0.5./x", "public").ok).toBe(false);
    expect(validateWebhookEgress("http://metadata.google.internal./x", "public").ok).toBe(false);
    // a genuinely public host stays allowed in its root form
    expect(validateWebhookEgress("https://hooks.example.com./x", "public").ok).toBe(true);
    // allowlist matches the root form of a pinned name
    expect(validateWebhookEgress("http://message-server./x", "allowlist", ["message-server"]).ok).toBe(true);
    expect(validateWebhookEgress("http://evil.example.com./x", "allowlist", ["message-server"]).ok).toBe(false);
  });

  it("exposes the header names the guard reads", () => {
    expect(WEBHOOK_SIGNATURE_HEADER).toBe("x-event-signature");
  });
});
