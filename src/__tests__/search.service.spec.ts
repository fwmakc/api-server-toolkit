import {
  buildSearchWhere,
  mergeSearchWhere,
  searchService,
} from '../common/service/search.service';
import { ILike, FindOperator } from 'typeorm';

describe('search.service', () => {
  describe('buildSearchWhere', () => {
    it('AND mode: builds cross-product for single term × single field', () => {
      const result = buildSearchWhere({
        fields: ['name'],
        terms: ['alice'],
        method: undefined,
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ name: expect.any(FindOperator) });
    });

    it('AND mode: builds n×m combinations for multiple terms and fields', () => {
      const result = buildSearchWhere({
        fields: ['name', 'email'],
        terms: ['alice', 'bob'],
        method: undefined,
      });
      expect(result).toHaveLength(4);
    });

    it('AND mode: lowercases terms', () => {
      const result = buildSearchWhere({
        fields: ['name'],
        terms: ['ALICE'],
        method: undefined,
      });
      const op = result[0].name as FindOperator<string>;
      expect(op.value).toBe('%alice%');
    });

    it('OR mode: builds flat cross-product', () => {
      const result = buildSearchWhere({
        fields: ['name', 'email'],
        terms: ['alice', 'bob'],
        method: 'or',
      });
      expect(result).toHaveLength(4);
    });

    it('OR mode: lowercases terms', () => {
      const result = buildSearchWhere({
        fields: ['name'],
        terms: ['ALICE'],
        method: 'or',
      });
      const op = result[0].name as FindOperator<string>;
      expect(op.value).toBe('%alice%');
    });

    it('handles dotted/nested field paths', () => {
      const result = buildSearchWhere({
        fields: ['profile.name'],
        terms: ['alice'],
        method: undefined,
      });
      expect(result[0]).toHaveProperty('profile');
      expect(result[0].profile).toHaveProperty('name');
    });

    it('produces ILike operators', () => {
      const result = buildSearchWhere({
        fields: ['title'],
        terms: ['hello'],
        method: undefined,
      });
      const op = result[0].title;
      expect(op).toBeInstanceOf(FindOperator);
      expect(op.value).toBe('%hello%');
    });

    it('handles case-insensitive method string', () => {
      const result = buildSearchWhere({
        fields: ['name'],
        terms: ['x'],
        method: 'OR' as any,
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('mergeSearchWhere', () => {
    it('returns base when searchWhere is empty', () => {
      const base = { status: 'active' };
      expect(mergeSearchWhere(base, [])).toBe(base);
    });

    it('returns base when searchWhere is null', () => {
      const base = { status: 'active' };
      expect(mergeSearchWhere(base, null as any)).toBe(base);
    });

    it('returns single search clause (not array) when no base', () => {
      const search = [{ name: ILike('%alice%') }];
      const result = mergeSearchWhere({}, search);
      expect(result).toEqual(search[0]);
    });

    it('returns array when multiple search clauses and no base', () => {
      const search = [
        { name: ILike('%a%') },
        { name: ILike('%b%') },
      ];
      const result = mergeSearchWhere({}, search);
      expect(result).toEqual(search);
    });

    it('merges base with each search clause', () => {
      const base = { status: 'active' };
      const search = [{ name: ILike('%alice%') }];
      const result = mergeSearchWhere(base, search);
      expect(result).toEqual({ status: 'active', name: expect.any(FindOperator) });
    });

    it('returns single merged object when one search clause + base', () => {
      const base = { orgId: 1 };
      const search = [{ name: ILike('%x%') }];
      const result = mergeSearchWhere(base, search);
      expect(Array.isArray(result)).toBe(false);
    });

    it('returns array when multiple search clauses + base', () => {
      const base = { orgId: 1 };
      const search = [
        { name: ILike('%a%') },
        { name: ILike('%b%') },
      ];
      const result = mergeSearchWhere(base, search);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });
  });

  describe('searchService (in-memory filter)', () => {
    it('returns true when all terms match (AND mode)', () => {
      const result = searchService(
        { name: 'Alice Wonderland', email: 'alice@example.com' },
        { fields: ['name', 'email'], terms: ['alice', 'wonder'], method: undefined },
      );
      expect(result).toBe(true);
    });

    it('returns false when not all terms match (AND mode)', () => {
      const result = searchService(
        { name: 'Alice Wonderland', email: 'alice@example.com' },
        { fields: ['name', 'email'], terms: ['alice', 'bob'], method: undefined },
      );
      expect(result).toBe(false);
    });

    it('returns true when any term matches (OR mode)', () => {
      const result = searchService(
        { name: 'Alice', email: 'bob@example.com' },
        { fields: ['name', 'email'], terms: ['alice', 'bob'], method: 'or' },
      );
      expect(result).toBe(true);
    });

    it('returns false when no terms match (OR mode)', () => {
      const result = searchService(
        { name: 'Alice', email: 'alice@example.com' },
        { fields: ['name', 'email'], terms: ['charlie'], method: 'or' },
      );
      expect(result).toBe(false);
    });

    it('handles dotted field paths', () => {
      const result = searchService(
        { profile: { name: 'Alice' } },
        { fields: ['profile.name'], terms: ['alice'], method: undefined },
      );
      expect(result).toBe(true);
    });

    it('handles missing fields gracefully', () => {
      const result = searchService(
        { name: 'Alice' },
        { fields: ['email'], terms: ['alice'], method: undefined },
      );
      expect(result).toBe(false);
    });

    it('lowercases both text and terms', () => {
      const result = searchService(
        { name: 'ALICE' },
        { fields: ['name'], terms: ['alice'], method: undefined },
      );
      expect(result).toBe(true);
    });
  });
});
