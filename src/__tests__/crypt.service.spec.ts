import { encrypt, decrypt, currentAesVersion, AesEnvelope } from '../common/service/crypt.service';
import { BadRequestException } from '@nestjs/common';

const V1_KEY = 'a'.repeat(64);
const V2_KEY = 'b'.repeat(64);

describe('crypt.service AES versioning', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.AES_SECRET;
    delete process.env.AES_SECRET_V2;
    delete process.env.AES_SECRET_V3;
  });

  afterAll(() => {
    process.env.AES_SECRET = originalEnv.AES_SECRET;
    process.env.AES_SECRET_V2 = originalEnv.AES_SECRET_V2;
  });

  it('reports version 1 when only AES_SECRET is configured', () => {
    process.env.AES_SECRET = V1_KEY;
    expect(currentAesVersion()).toBe(1);
  });

  it('reports the highest configured version as current', () => {
    process.env.AES_SECRET = V1_KEY;
    process.env.AES_SECRET_V2 = V2_KEY;
    expect(currentAesVersion()).toBe(2);
  });

  it('throws when no AES key is configured', () => {
    expect(() => currentAesVersion()).toThrow('AES_SECRET is not configured');
  });

  it('round-trips with the legacy key and stamps v:1', async () => {
    process.env.AES_SECRET = V1_KEY;
    const envelope = await encrypt('secret-payload');
    expect(envelope.v).toBe(1);
    expect(await decrypt(envelope.encrypted, envelope.iv, envelope.v)).toBe('secret-payload');
  });

  it('decrypts a legacy envelope with no version field (backward compat)', async () => {
    process.env.AES_SECRET = V1_KEY;
    const envelope: AesEnvelope = await encrypt('old-data');
    const legacy = { encrypted: envelope.encrypted, iv: envelope.iv };
    expect(await decrypt(legacy.encrypted, legacy.iv)).toBe('old-data');
  });

  it('encrypts with the current (highest) version and dispatches on it', async () => {
    process.env.AES_SECRET = V1_KEY;
    process.env.AES_SECRET_V2 = V2_KEY;
    const envelope = await encrypt('rotated-data');
    expect(envelope.v).toBe(2);
    expect(await decrypt(envelope.encrypted, envelope.iv, envelope.v)).toBe('rotated-data');
  });

  it('a v2 envelope does not decrypt with the v1 key', async () => {
    process.env.AES_SECRET = V1_KEY;
    process.env.AES_SECRET_V2 = V2_KEY;
    const envelope = await encrypt('rotated-data');
    expect(
      async () => await decrypt(envelope.encrypted, envelope.iv, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects an unconfigured version with a clear message', async () => {
    process.env.AES_SECRET = V1_KEY;
    await expect(async () => await decrypt('00', '00', 3)).rejects.toThrow(
      'AES_SECRET_V3 is missing',
    );
  });
});
