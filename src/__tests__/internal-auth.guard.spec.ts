import { InternalAuthGuard } from '../common/guard/internal-auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

describe('InternalAuthGuard', () => {
  let configService: jest.Mocked<ConfigService>;
  let guard: InternalAuthGuard;

  function mockContext(headers: Record<string, string>) {
    const request = { headers };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;
  }

  beforeEach(() => {
    configService = { get: jest.fn() } as any;
    guard = new InternalAuthGuard(configService);
  });

  describe('rotation window (INTERNAL_API_KEY_PREVIOUS)', () => {
    function mockEnv(values: Record<string, string | undefined>) {
      configService.get.mockImplementation((key: string) => values[key]);
    }

    it('accepts the previous key while it is still listed', () => {
      mockEnv({
        INTERNAL_API_KEY: 'new-key',
        INTERNAL_API_KEY_PREVIOUS: 'old-key-1, old-key-2',
      });
      const ctx = mockContext({ 'x-internal-api-key': 'old-key-2' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('accepts the current key alongside previous ones', () => {
      mockEnv({
        INTERNAL_API_KEY: 'new-key',
        INTERNAL_API_KEY_PREVIOUS: 'old-key-1',
      });
      const ctx = mockContext({ 'x-internal-api-key': 'new-key' });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('rejects a key that is neither current nor previous', () => {
      mockEnv({
        INTERNAL_API_KEY: 'new-key',
        INTERNAL_API_KEY_PREVIOUS: 'old-key-1',
      });
      const ctx = mockContext({ 'x-internal-api-key': 'retired-key' });
      expect(() => guard.canActivate(ctx)).toThrow('Invalid or missing');
    });

    it('rejects the previous key once the rotation window closes', () => {
      mockEnv({ INTERNAL_API_KEY: 'new-key' });
      const ctx = mockContext({ 'x-internal-api-key': 'old-key-1' });
      expect(() => guard.canActivate(ctx)).toThrow('Invalid or missing');
    });

    it('ignores blank previous entries', () => {
      mockEnv({ INTERNAL_API_KEY: 'new-key', INTERNAL_API_KEY_PREVIOUS: ' ,' });
      const ctx = mockContext({ 'x-internal-api-key': 'new-key' });
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  it('returns true when API key matches', () => {
    configService.get.mockReturnValue('expected-key');
    const ctx = mockContext({ 'x-internal-api-key': 'expected-key' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('compares via crypto.timingSafeEqual (pin: no plain string equality)', () => {
    const spy = jest.spyOn(crypto, 'timingSafeEqual');
    configService.get.mockReturnValue('expected-key');
    const ctx = mockContext({ 'x-internal-api-key': 'expected-key' });
    expect(guard.canActivate(ctx)).toBe(true);
    expect(spy).toHaveBeenCalledWith(
      Buffer.from('expected-key'),
      Buffer.from('expected-key'),
    );
    spy.mockRestore();
  });

  it('throws when API key does not match', () => {
    configService.get.mockReturnValue('expected-key');
    const ctx = mockContext({ 'x-internal-api-key': 'wrong-key' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(ctx)).toThrow('Invalid or missing');
  });

  it('throws when API key header is missing', () => {
    configService.get.mockReturnValue('expected-key');
    const ctx = mockContext({});
    expect(() => guard.canActivate(ctx)).toThrow('Invalid or missing');
  });

  it('throws when INTERNAL_API_KEY env var is not configured', () => {
    configService.get.mockReturnValue(undefined);
    const ctx = mockContext({ 'x-internal-api-key': 'some-key' });
    expect(() => guard.canActivate(ctx)).toThrow('INTERNAL_API_KEY is not configured');
  });

  it('throws when INTERNAL_API_KEY is empty string', () => {
    configService.get.mockReturnValue('');
    const ctx = mockContext({ 'x-internal-api-key': '' });
    expect(() => guard.canActivate(ctx)).toThrow('INTERNAL_API_KEY is not configured');
  });

  it('rejects key that is a prefix of expected', () => {
    configService.get.mockReturnValue('secret-key-123');
    const ctx = mockContext({ 'x-internal-api-key': 'secret-key' });
    expect(() => guard.canActivate(ctx)).toThrow('Invalid or missing');
  });

  it('rejects key that has expected as prefix', () => {
    configService.get.mockReturnValue('secret-key');
    const ctx = mockContext({ 'x-internal-api-key': 'secret-key-123' });
    expect(() => guard.canActivate(ctx)).toThrow('Invalid or missing');
  });
});
