import { createHash, webcrypto } from 'node:crypto';
import * as dotenv from 'dotenv';
import { BadRequestException } from '@nestjs/common';

dotenv.config();

// AES key versions for secret rotation. AES_SECRET is version 1 (the legacy
// env, unchanged); AES_SECRET_V2 … AES_SECRET_V9 extend it. The highest
// configured version is "current": encrypt() stamps it into the envelope's
// `v` field, decrypt() dispatches on that field (absent = 1, so every
// envelope written before this mechanism exists keeps decrypting with
// AES_SECRET). Rotation: configure the new key as the next version, re-encrypt
// stored data (auth-server scripts/reencrypt-aes.mjs), then retire the old
// env once nothing references it — runbook in gateway-server/docs.
const MAX_AES_VERSION = 9;

export interface AesEnvelope {
  v?: number;
  encrypted: string;
  iv: string;
}

function aesKeyEnvName(version: number): string {
  return version === 1 ? 'AES_SECRET' : `AES_SECRET_V${version}`;
}

export function currentAesVersion(): number {
  let current = 0;
  for (let version = 1; version <= MAX_AES_VERSION; version++) {
    if (process.env[aesKeyEnvName(version)]) current = version;
  }
  if (!current) {
    throw new BadRequestException('AES_SECRET is not configured');
  }
  return current;
}

function hexToBytes(hex: string, strict: boolean): Uint8Array {
  const pairs = String(hex ?? '').match(/.{1,2}/g);
  if (!pairs?.length) {
    throw new BadRequestException('Expected a hex string');
  }
  const bytes = pairs.map((byte) => parseInt(byte, 16));
  // Version 1 keeps the legacy lenient parse: pre-0.25.0 stacks could set a
  // non-hex AES_SECRET (parseInt → NaN → byte 0), and envelopes written that
  // way must stay decryptable through rotation. Version 2+ keys must be real
  // hex — a typo there must not silently collapse the key.
  if (bytes.some((byte) => Number.isNaN(byte))) {
    if (strict) {
      throw new BadRequestException(
        'AES key must be a hex string for versions above 1 (openssl rand -hex 32)',
      );
    }
    return new Uint8Array(bytes.map((byte) => (Number.isNaN(byte) ? 0 : byte)));
  }
  return new Uint8Array(bytes);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function importAesKey(
  version: number,
  usages: import('crypto').webcrypto.KeyUsage[],
): Promise<import('crypto').webcrypto.CryptoKey> {
  const key = process.env[aesKeyEnvName(version)];
  if (!key) {
    throw new BadRequestException(
      `AES key version ${version} is not configured (${aesKeyEnvName(version)} is missing)`,
    );
  }
  return webcrypto.subtle.importKey(
    'raw',
    hexToBytes(key, version > 1),
    { name: 'AES-GCM' },
    false,
    usages,
  );
}

export async function encrypt(data): Promise<AesEnvelope> {
  try {
    const version = currentAesVersion();
    const cryptoKey = await importAesKey(version, ['encrypt']);

    // Генерируем случайный вектор инициализации
    const iv = await webcrypto.getRandomValues(new Uint8Array(12));

    // Шифруем данные
    const encrypted = await webcrypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      cryptoKey,
      new TextEncoder().encode(data),
    );

    // Зашифрованные данные + вектор инициализации + версия ключа
    return {
      v: version,
      encrypted: bytesToHex(new Uint8Array(encrypted)),
      iv: bytesToHex(iv),
    };
  } catch (e) {
    throw new BadRequestException(`Error encrypting data: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export async function decrypt(
  encryptedData,
  iv,
  version = 1,
): Promise<string> {
  try {
    const cryptoKey = await importAesKey(version, ['decrypt']);

    // Расшифровываем данные
    const decrypted = await webcrypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: hexToBytes(iv, version > 1),
      },
      cryptoKey,
      hexToBytes(encryptedData, version > 1),
    );

    // Возвращаем расшифрованные данные в виде строки
    return new TextDecoder().decode(new Uint8Array(decrypted));
  } catch (e) {
    throw new BadRequestException(`Error decrypting data: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function hash(data, type = 'md5') {
  return createHash(type).update(data).copy().digest('hex');
}
