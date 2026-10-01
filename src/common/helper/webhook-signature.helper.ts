import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/**
 * HMAC trust for event-bus deliveries. Each subscriber holds its own secret;
 * event-server signs every delivery with it. Subscribers verify the signature
 * AND the freshness window, so a leaked payload cannot be replayed and a
 * leaked secret compromises only that one subscriber (unlike the shared
 * X-Internal-Api-Key that used to authenticate deliveries).
 */

export const WEBHOOK_SIGNATURE_HEADER = "x-event-signature";
export const WEBHOOK_TIMESTAMP_HEADER = "x-event-timestamp";

const SIGNATURE_SCHEME = "sha256=";
/** Deliveries older/newer than this are rejected as replays. */
export const DEFAULT_TIMESTAMP_TOLERANCE_SECONDS = 300;

/** Per-subscriber secret: 32 random bytes, hex. */
export const generateWebhookSecret = (): string =>
  randomBytes(32).toString("hex");

/**
 * Sign a delivery. `timestamp` is unix seconds and is covered by the HMAC
 * together with the exact bytes on the wire (httpPost serializes with
 * JSON.stringify — sign THAT string, pass the object to httpPost).
 */
export const signEventDelivery = (
  secret: string,
  timestamp: number,
  rawBody: string,
): string =>
  SIGNATURE_SCHEME +
  createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");

/** Constant-time verify: signature + freshness window (anti-replay). */
export const verifyEventDelivery = (
  secret: string,
  rawBody: string,
  signature: string | undefined,
  timestamp: string | number | undefined,
  toleranceSeconds: number = DEFAULT_TIMESTAMP_TOLERANCE_SECONDS,
): boolean => {
  if (!secret || !rawBody || !signature || timestamp === undefined) {
    return false;
  }
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || ts <= 0) return false;
  if (Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) return false;

  const expected = Buffer.from(signEventDelivery(secret, ts, rawBody));
  const provided = Buffer.from(String(signature));
  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
};

// ─── SSRF egress validation ────────────────────────────────────────────────
// subscriber.url is stored in the DB and called by event-server: without
// validation anyone who can register a subscriber probes internal services
// (metadata endpoints, admin panels, databases).

export type WebhookEgressMode = "internal" | "public" | "allowlist";

/** Remaining risk (documented in PENTEST.md): DNS rebinding in `internal`
 * and `public` modes — a hostname can resolve to a private IP after the
 * check. `allowlist` pins exact hostnames and closes that for pinned names. */
export interface WebhookEgressCheck {
  ok: boolean;
  reason?: string;
}

const BLOCKED_V4_CIDRS: Array<[number, number]> = [
  [0x00000000, 8], // 0.0.0.0/8 "this network"
  [0x0a000000, 8], // 10/8 private
  [0x64400000, 10], // 100.64/10 CGNAT
  [0x7f000000, 8], // 127/8 loopback
  [0xa9fe0000, 16], // 169.254/16 link-local (incl. cloud metadata)
  [0xac100000, 12], // 172.16/12 private
  [0xc0000200, 24], // 192.0.2/24 TEST-NET-1
  [0xc0a80000, 16], // 192.168/16 private
  [0xc6120000, 15], // 198.18/15 benchmarking
  [0xc6336400, 24], // 198.51.100/24 TEST-NET-2
  [0xcb007100, 24], // 203.0.113/24 TEST-NET-3
  [0xe0000000, 4], // 224/4 multicast
  [0xf0000000, 4], // 240/4 reserved + broadcast
];

const ipv4ToInt = (ip: string): number | null => {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value;
};

const isBlockedIpv4 = (ip: string): boolean => {
  const value = ipv4ToInt(ip);
  if (value === null) return true;
  return BLOCKED_V4_CIDRS.some(
    ([base, bits]) => value >>> (32 - bits) === base >>> (32 - bits),
  );
};

/** Minimal v6 classification — enough for loopback/private/link-local/multicast. */
const isBlockedIpv6 = (raw: string): boolean => {
  const ip = raw.toLowerCase().replace(/^\[|\]$/g, "");
  // IPv4-mapped (::ffff:10.0.0.1) — judge by the embedded v4
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIpv4(mapped[1]);
  if (ip === "::" || ip === "::1") return true; // unspecified, loopback
  if (ip.startsWith("fe8") || ip.startsWith("fe9") || ip.startsWith("fea") || ip.startsWith("feb"))
    return true; // fe80::/10 link-local
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true; // fc00::/7 unique-local
  if (ip.startsWith("ff")) return true; // ff00::/8 multicast
  if (ip.startsWith("2001:db8")) return true; // documentation range
  return false;
};

const isBlockedIp = (ip: string): boolean => {
  if (ip.includes(":")) return isBlockedIpv6(ip);
  // not an IP literal at all (a DNS name) — judged by name rules, not ranges
  if (ipv4ToInt(ip) === null) return false;
  return isBlockedIpv4(ip);
};

const isPrivateHostname = (hostname: string): boolean => {
  // Trailing dot is the DNS root form (`localhost.` == `localhost`,
  // `127.0.0.1.` parses like an IP) — normalize before any name/rule check,
  // otherwise `http://localhost./` slips past the public-mode filters.
  const host = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.+$/, "");
  // .local / mDNS and bare names without a dot never leave the segment
  if (host.endsWith(".local") || host.endsWith(".internal") || !host.includes("."))
    return true;
  return isBlockedIp(host);
};

/**
 * Validate a subscriber URL against the deployment's egress policy.
 * - `internal` (default, dev/stack): any http(s) URL is allowed — subscribers
 *   live on the internal network by design.
 * - `public`: only public hosts (blocks literal private IPs and obviously
 *   local names; a resolving DNS can still rebind — see PENTEST.md).
 * - `allowlist`: hostname must match `allowlist` exactly (case-insensitive).
 * IPv4-mapped IPv6 and the metadata range are always treated as private.
 */
export const validateWebhookEgress = (
  url: string,
  mode: WebhookEgressMode = "internal",
  allowlist: string[] = [],
): WebhookEgressCheck => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: "not a valid URL" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: `scheme must be http(s), got ${parsed.protocol}` };
  }
  const hostname = parsed.hostname;
  if (!hostname) return { ok: false, reason: "empty hostname" };

  if (mode === "allowlist") {
    // Compare the root-stripped hostname too: `Host.example.` must match an
    // allowlist entry for `host.example` (same machine, same policy).
    const normalized = hostname.toLowerCase().replace(/\.+$/, "");
    const match = allowlist.some(
      (entry) => entry.trim().toLowerCase().replace(/\.+$/, "") === normalized,
    );
    return match
      ? { ok: true }
      : { ok: false, reason: `hostname ${hostname} is not in the egress allowlist` };
  }

  if (mode === "public" && isPrivateHostname(hostname)) {
    return { ok: false, reason: `hostname ${hostname} resolves to a non-public range` };
  }

  // `internal` mode: only scheme sanity (documented trust boundary)
  return { ok: true };
};
