import { except, only, setIfFilled } from '../common/helper/object.helper';

describe('except', () => {
  it('removes a single key (string)', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(except(obj, 'b')).toEqual({ a: 1, c: 3 });
  });

  it('removes multiple keys (array)', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(except(obj, ['a', 'c'])).toEqual({ b: 2 });
  });

  it('returns empty object when all keys removed', () => {
    const obj = { a: 1 };
    expect(except(obj, 'a')).toEqual({});
  });

  it('returns same object when key removed that exists', () => {
    const obj = { a: 1, b: 2 };
    expect(except(obj, 'b')).toEqual({ a: 1 });
  });
});

describe('only', () => {
  it('keeps a single key (string)', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(only(obj, 'b')).toEqual({ b: 2 });
  });

  it('keeps multiple keys (array)', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(only(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });

  it('returns only matched keys when some exist', () => {
    const obj = { a: 1, b: 2 };
    expect(only(obj, 'a')).toEqual({ a: 1 });
  });
});

describe('setIfFilled', () => {
  it('copies filled fields from source to target (no mapping)', () => {
    const target = { name: '', age: 0 };
    const source = { name: 'John', age: 25, extra: true };
    setIfFilled(target, source);
    expect(target).toEqual({ name: 'John', age: 25 });
  });

  it('skips empty string fields', () => {
    const target = { name: 'old' };
    const source = { name: '' };
    setIfFilled(target, source);
    expect(target.name).toBe('old');
  });

  it('skips null fields', () => {
    const target = { name: 'old' };
    const source = { name: null };
    setIfFilled(target, source);
    expect(target.name).toBe('old');
  });

  it('skips undefined fields', () => {
    const target = { name: 'old' };
    const source = { name: undefined };
    setIfFilled(target, source);
    expect(target.name).toBe('old');
  });

  it('copies only mapped keys (array mapping)', () => {
    const target = { name: '', age: 0 };
    const source = { name: 'Alice', age: 30, extra: true };
    setIfFilled(target, source, ['name']);
    expect(target).toEqual({ name: 'Alice', age: 0 });
  });

  it('copies with object mapping (key as string)', () => {
    const target = { title: '' };
    const source = { name: 'Bob' };
    setIfFilled(target, source, { title: 'name' });
    expect(target.title).toBe('Bob');
  });

  it('copies with object mapping (transform function)', () => {
    const target = { name: '' };
    const source = { name: 'bob' };
    setIfFilled(target, source, { name: { sourceKey: 'name', transform: (v) => String(v).toUpperCase() } });
    expect(target.name).toBe('BOB');
  });

  it('sets only keys that exist in target', () => {
    const target = { name: '' };
    const source = { name: 'Test', extra: true };
    setIfFilled(target, source);
    expect(target.name).toBe('Test');
    expect((target as any).extra).toBeUndefined();
  });
});
