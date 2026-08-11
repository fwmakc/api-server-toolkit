import { isFilled } from '../common/helper/scalar.helper';

describe('isFilled', () => {
  it('returns true for non-empty string', () => {
    expect(isFilled('hello')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isFilled('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isFilled(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isFilled(undefined)).toBe(false);
  });

  it('returns true for zero', () => {
    expect(isFilled(0)).toBe(true);
  });

  it('returns true for false', () => {
    expect(isFilled(false)).toBe(true);
  });

  it('returns true for empty array', () => {
    expect(isFilled([])).toBe(true);
  });

  it('returns true for empty object', () => {
    expect(isFilled({})).toBe(true);
  });
});
