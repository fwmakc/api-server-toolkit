import { arrayWrap, arrayUnwrap } from '../common/helper/array.helper';

describe('arrayWrap', () => {
  it('wraps a non-array value in an array', () => {
    expect(arrayWrap(1)).toEqual([1]);
  });

  it('wraps a string in an array', () => {
    expect(arrayWrap('hello')).toEqual(['hello']);
  });

  it('returns the same array if already an array', () => {
    const arr = [1, 2, 3];
    expect(arrayWrap(arr)).toBe(arr);
  });

  it('wraps null in an array', () => {
    expect(arrayWrap(null)).toEqual([null]);
  });

  it('wraps undefined in an array', () => {
    expect(arrayWrap(undefined)).toEqual([undefined]);
  });
});

describe('arrayUnwrap', () => {
  it('returns first element from non-empty array', () => {
    expect(arrayUnwrap([1, 2, 3])).toBe(1);
  });

  it('returns the value itself if not an array', () => {
    expect(arrayUnwrap(42)).toBe(42);
  });

  it('returns the string itself if not an array', () => {
    expect(arrayUnwrap('hello')).toBe('hello');
  });

  it('returns empty array as-is (length 0)', () => {
    expect(arrayUnwrap([])).toEqual([]);
  });
});
