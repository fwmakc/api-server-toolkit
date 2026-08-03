import {
  normalizeAccess,
  getBindPath,
  AccessLevel,
  OperationAccess,
} from '../common/access.type';

describe('access.type utilities', () => {
  describe('normalizeAccess', () => {
    it('returns string access as-is', () => {
      expect(normalizeAccess('public')).toBe('public');
      expect(normalizeAccess('superuser')).toBe('superuser');
      expect(normalizeAccess('owner')).toBe('owner');
      expect(normalizeAccess('closed')).toBe('closed');
      expect(normalizeAccess('account')).toBe('account');
    });

    it('extracts level from object form', () => {
      expect(normalizeAccess({ level: 'owner' })).toBe('owner');
      expect(normalizeAccess({ level: 'owner', bindPath: 'custom.path' })).toBe('owner');
    });

    it('returns fallback when undefined', () => {
      expect(normalizeAccess(undefined)).toBe('closed');
      expect(normalizeAccess(undefined, 'public')).toBe('public');
    });

    it('default fallback is closed', () => {
      expect(normalizeAccess(undefined)).toBe('closed');
    });
  });

  describe('getBindPath', () => {
    it('returns bindPath from object form when provided', () => {
      expect(getBindPath({ level: 'owner', bindPath: 'custom.path' }, 'fallback')).toBe('custom.path');
    });

    it('returns fallback for plain "owner" string', () => {
      expect(getBindPath('owner', 'fallback')).toBe('fallback');
    });

    it('returns fallback for { level: "owner" } without bindPath', () => {
      expect(getBindPath({ level: 'owner' }, 'fallback')).toBe('fallback');
    });

    it('returns undefined for non-owner access levels', () => {
      expect(getBindPath('public', 'fallback')).toBeUndefined();
      expect(getBindPath('superuser', 'fallback')).toBeUndefined();
      expect(getBindPath('account', 'fallback')).toBeUndefined();
      expect(getBindPath('closed', 'fallback')).toBeUndefined();
    });

    it('returns undefined for undefined access', () => {
      expect(getBindPath(undefined, 'fallback')).toBeUndefined();
    });
  });
});
