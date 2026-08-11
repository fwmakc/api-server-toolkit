import {
  normalizeAccess,
  getBindPath,
  AccessLevel,
  OperationAccess,
} from '../common/access.type';

describe('access.type utilities', () => {
  describe('normalizeAccess', () => {
    it('returns enum access as-is', () => {
      expect(normalizeAccess(AccessLevel.PUBLIC)).toBe(AccessLevel.PUBLIC);
      expect(normalizeAccess(AccessLevel.SUPERUSER)).toBe(AccessLevel.SUPERUSER);
      expect(normalizeAccess(AccessLevel.OWNER)).toBe(AccessLevel.OWNER);
      expect(normalizeAccess(AccessLevel.CLOSED)).toBe(AccessLevel.CLOSED);
      expect(normalizeAccess(AccessLevel.ACCOUNT)).toBe(AccessLevel.ACCOUNT);
    });

    it('extracts level from object form', () => {
      expect(normalizeAccess({ level: AccessLevel.OWNER })).toBe(AccessLevel.OWNER);
      expect(normalizeAccess({ level: AccessLevel.OWNER, bindPath: 'custom.path' })).toBe(AccessLevel.OWNER);
    });

    it('returns fallback when undefined', () => {
      expect(normalizeAccess(undefined)).toBe(AccessLevel.CLOSED);
      expect(normalizeAccess(undefined, AccessLevel.PUBLIC)).toBe(AccessLevel.PUBLIC);
    });

    it('default fallback is closed', () => {
      expect(normalizeAccess(undefined)).toBe(AccessLevel.CLOSED);
    });
  });

  describe('getBindPath', () => {
    it('returns bindPath from object form when provided', () => {
      expect(getBindPath({ level: AccessLevel.OWNER, bindPath: 'custom.path' }, 'fallback')).toBe('custom.path');
    });

    it('returns fallback for plain OWNER enum', () => {
      expect(getBindPath(AccessLevel.OWNER, 'fallback')).toBe('fallback');
    });

    it('returns fallback for { level: OWNER } without bindPath', () => {
      expect(getBindPath({ level: AccessLevel.OWNER }, 'fallback')).toBe('fallback');
    });

    it('returns undefined for non-owner access levels', () => {
      expect(getBindPath(AccessLevel.PUBLIC, 'fallback')).toBeUndefined();
      expect(getBindPath(AccessLevel.SUPERUSER, 'fallback')).toBeUndefined();
      expect(getBindPath(AccessLevel.ACCOUNT, 'fallback')).toBeUndefined();
      expect(getBindPath(AccessLevel.CLOSED, 'fallback')).toBeUndefined();
    });

    it('returns undefined for undefined access', () => {
      expect(getBindPath(undefined, 'fallback')).toBeUndefined();
    });
  });
});
