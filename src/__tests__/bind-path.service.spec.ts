import { buildNestedWhere } from '../common/service/bind-path.service';

describe('buildNestedWhere', () => {
  it('simple path "user" → { user: { id: value } }', () => {
    expect(buildNestedWhere('user', 'id', 42)).toEqual({ user: { id: 42 } });
  });

  it('nested path "user.team" → { user: { team: { id: value } } }', () => {
    expect(buildNestedWhere('user.team', 'id', 7)).toEqual({
      user: { team: { id: 7 } },
    });
  });

  it('deep path "a.b.c" → { a: { b: { c: { id: value } } } }', () => {
    expect(buildNestedWhere('a.b.c', 'id', 99)).toEqual({
      a: { b: { c: { id: 99 } } },
    });
  });

  it('custom key "uuid" → { user: { uuid: value } }', () => {
    expect(buildNestedWhere('user', 'uuid', 'abc-123')).toEqual({
      user: { uuid: 'abc-123' },
    });
  });

  it('empty name falls back to "account"', () => {
    expect(buildNestedWhere('', 'id', 1)).toEqual({ account: { id: 1 } });
  });

  it('single segment without dot uses default key', () => {
    expect(buildNestedWhere('team', 'id', 5)).toEqual({ team: { id: 5 } });
  });

  it('custom key with nested path', () => {
    expect(buildNestedWhere('a.b', 'uuid', 'x')).toEqual({
      a: { b: { uuid: 'x' } },
    });
  });
});
