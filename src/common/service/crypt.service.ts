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

function hexToBytes(hex: string): Uint8Array {
  const bytes = String(hex ?? '')
    .match(/.{1,2}/g)
    ?.map((byte) => parseInt(byte, 16));
  if (!bytes?.length || bytes.some((byte) => Number.isNaN(byte))) {
    throw new BadRequestException('Expected a hex string');
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
  usages: KeyUsage[],
): Promise<CryptoKey> {
  const key = process.env[aesKeyEnvName(version)];
  if (!key) {
    throw new BadRequestException(
      `AES key version ${version} is not configured (${aesKeyEnvName(version)} is missing)`,
    );
  }
  return webcrypto.subtle.importKey(
    'raw',
    hexToBytes(key),
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
        iv: hexToBytes(iv),
      },
      cryptoKey,
      hexToBytes(encryptedData),
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
