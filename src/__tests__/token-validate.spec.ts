import { tokenValidate, tokenValidateSimple } from '../common/guard/secure.guard.service';
import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';

describe('secure.guard.service', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  describe('tokenValidate', () => {
    function makeToken(secret: string, method: string): string {
      const ts = Math.floor(Date.now() / 1000).toString();
      const string = `${secret}.${ts}`;
      const hashed = createHash(method.toLowerCase()).update(string).digest('hex');
      return `${hashed}.${ts}`;
    }

    it('throws when token is empty', () => {
      expect(() => tokenValidate('')).toThrow(UnauthorizedException);
      expect(() => tokenValidate('')).toThrow('Token is missing');
    });

    it('throws when token is null/undefined', () => {
      expect(() => tokenValidate(null as any)).toThrow('Token is missing');
      expect(() => tokenValidate(undefined as any)).toThrow('Token is missing');
    });

    it('returns true for valid MD5 token', () => {
      process.env.SECURE_SECRET = 'my-secret';
      process.env.SECURE_METHOD = 'MD5';
      process.env.SECURE_EXPIRES = '3600';
      const token = makeToken('my-secret', 'md5');
      expect(tokenValidate(token)).toBe(true);
    });

    it('returns true for valid SHA256 token', () => {
      process.env.SECURE_SECRET = 'another-secret';
      process.env.SECURE_METHOD = 'sha256';
      process.env.SECURE_EXPIRES = '3600';
      const token = makeToken('another-secret', 'sha256');
      expect(tokenValidate(token)).toBe(true);
    });

    it('defaults to MD5 when SECURE_METHOD not set', () => {
      process.env.SECURE_SECRET = 'test-secret';
      delete process.env.SECURE_METHOD;
      process.env.SECURE_EXPIRES = '3600';
      const token = makeToken('test-secret', 'md5');
      expect(tokenValidate(token)).toBe(true);
    });

    it('throws "Token is invalid" for wrong hash', () => {
      process.env.SECURE_SECRET = 'correct-secret';
      process.env.SECURE_METHOD = 'md5';
      const ts = Math.floor(Date.now() / 1000).toString();
      const wrongHash = 'deadbeef'.repeat(8);
      expect(() => tokenValidate(`${wrongHash}.${ts}`)).toThrow('Token is invalid');
    });

    it('throws "Token is fake" for future timestamp', () => {
      process.env.SECURE_SECRET = 'secret';
      process.env.SECURE_METHOD = 'md5';
      const futureTs = Math.floor(Date.now() / 1000) + 9999;
      const string = `secret.${futureTs}`;
      const hashed = createHash('md5').update(string).digest('hex');
      expect(() => tokenValidate(`${hashed}.${futureTs}`)).toThrow('Token is fake');
    });

    it('throws "Token is expired" for old timestamp', () => {
      process.env.SECURE_SECRET = 'secret';
      process.env.SECURE_METHOD = 'md5';
      process.env.SECURE_EXPIRES = '60';
      const oldTs = Math.floor(Date.now() / 1000) - 120;
      const string = `secret.${oldTs}`;
      const hashed = createHash('md5').update(string).digest('hex');
      expect(() => tokenValidate(`${hashed}.${oldTs}`)).toThrow('Token is expired');
    });

    it('does not check expiry when SECURE_EXPIRES is not set', () => {
      process.env.SECURE_SECRET = 'secret';
      process.env.SECURE_METHOD = 'md5';
      delete process.env.SECURE_EXPIRES;
      const oldTs = Math.floor(Date.now() / 1000) - 999999;
      const string = `secret.${oldTs}`;
      const hashed = createHash('md5').update(string).digest('hex');
      expect(tokenValidate(`${hashed}.${oldTs}`)).toBe(true);
    });
  });

  describe('tokenValidateSimple', () => {
    it('throws when token is empty', () => {
      expect(() => tokenValidateSimple('')).toThrow('Token is missing');
    });

    it('throws when SECURE_SIMPLE is not set', () => {
      delete process.env.SECURE_SIMPLE;
      expect(() => tokenValidateSimple('some-token')).toThrow('Token not set on server');
    });

    it('returns true when token matches SECURE_SIMPLE', () => {
      process.env.SECURE_SIMPLE = 'shared-secret';
      expect(tokenValidateSimple('shared-secret')).toBe(true);
    });

    it('returns false when token does NOT match SECURE_SIMPLE', () => {
      process.env.SECURE_SIMPLE = 'shared-secret';
      expect(tokenValidateSimple('wrong-token')).toBe(false);
    });
  });
});
