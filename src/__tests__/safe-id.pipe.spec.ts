import { SafeIdPipe } from '../common/pipe/safe_id.pipe';
import { BadRequestException } from '@nestjs/common';

describe('SafeIdPipe', () => {
  let pipe: SafeIdPipe;

  beforeEach(() => {
    pipe = new SafeIdPipe();
  });

  it('accepts a plain numeric string', () => {
    expect(pipe.transform('123')).toBe('123');
  });

  it('accepts a large bigint string', () => {
    const big = '9223372036854775807';
    expect(pipe.transform(big)).toBe(big);
  });

  it('trims surrounding whitespace', () => {
    expect(pipe.transform('  42  ')).toBe('42');
  });

  it('throws BadRequestException for letters', () => {
    expect(() => pipe.transform('abc')).toThrow(BadRequestException);
  });

  it('throws BadRequestException for alphanumeric', () => {
    expect(() => pipe.transform('12a34')).toThrow(BadRequestException);
  });

  it('throws BadRequestException for negative numbers', () => {
    expect(() => pipe.transform('-5')).toThrow(BadRequestException);
  });

  it('throws BadRequestException for decimals', () => {
    expect(() => pipe.transform('3.14')).toThrow(BadRequestException);
  });

  it('throws BadRequestException for SQL injection attempt', () => {
    expect(() => pipe.transform("1; DROP TABLE users")).toThrow(BadRequestException);
  });

  it('throws BadRequestException for empty string', () => {
    expect(() => pipe.transform('')).toThrow(BadRequestException);
  });

  it('handles null/undefined by throwing', () => {
    expect(() => pipe.transform(null as any)).toThrow(BadRequestException);
    expect(() => pipe.transform(undefined as any)).toThrow(BadRequestException);
  });

  it('includes the bad value in the error message', () => {
    try {
      pipe.transform('abc');
      fail('should have thrown');
    } catch (e) {
      expect(e.message).toContain('abc');
    }
  });
});
