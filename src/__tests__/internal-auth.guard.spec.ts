import { InternalAuthGuard } from '../common/guard/internal-auth.guard';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

  it('returns true when API key matches', () => {
    configService.get.mockReturnValue('expected-key');
    const ctx = mockContext({ 'x-internal-api-key': 'expected-key' });
    expect(guard.canActivate(ctx)).toBe(true);
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
