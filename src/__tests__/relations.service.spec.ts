import { relationsOrder } from '../common/service/relations.service';

describe('relationsOrder', () => {
  describe('compare (via relationsOrder)', () => {
    it('sorts numbers asc', () => {
      const result = [{ items: [{ val: 3 }, { val: 1 }, { val: 2 }] }];
      const sorted = relationsOrder(result, [{ name: 'items', order: 'val' }]);
      expect(sorted[0].items.map((i: any) => i.val)).toEqual([1, 2, 3]);
    });

    it('sorts numbers desc', () => {
      const result = [{ items: [{ val: 1 }, { val: 3 }, { val: 2 }] }];
      const sorted = relationsOrder(result, [{ name: 'items', order: 'val', desc: true }]);
      expect(sorted[0].items.map((i: any) => i.val)).toEqual([3, 2, 1]);
    });

    it('sorts strings asc (case-insensitive)', () => {
      const result = [{ items: [{ val: 'Charlie' }, { val: 'alice' }, { val: 'Bob' }] }];
      const sorted = relationsOrder(result, [{ name: 'items', order: 'val' }]);
      expect(sorted[0].items.map((i: any) => i.val)).toEqual(['alice', 'Bob', 'Charlie']);
    });

    it('sorts strings desc', () => {
      const result = [{ items: [{ val: 'alice' }, { val: 'Charlie' }, { val: 'Bob' }] }];
      const sorted = relationsOrder(result, [{ name: 'items', order: 'val', desc: true }]);
      expect(sorted[0].items.map((i: any) => i.val)).toEqual(['Charlie', 'Bob', 'alice']);
    });

    it('sorts dates asc', () => {
      const result = [{ items: [{ val: new Date('2025-03-01') }, { val: new Date('2025-01-01') }, { val: new Date('2025-02-01') }] }];
      const sorted = relationsOrder(result, [{ name: 'items', order: 'val' }]);
      expect(sorted[0].items[0].val).toEqual(new Date('2025-01-01'));
      expect(sorted[0].items[2].val).toEqual(new Date('2025-03-01'));
    });

    it('sorts dates desc', () => {
      const result = [{ items: [{ val: new Date('2025-01-01') }, { val: new Date('2025-03-01') }, { val: new Date('2025-02-01') }] }];
      const sorted = relationsOrder(result, [{ name: 'items', order: 'val', desc: true }]);
      expect(sorted[0].items[0].val).toEqual(new Date('2025-03-01'));
      expect(sorted[0].items[2].val).toEqual(new Date('2025-01-01'));
    });

    it('treats null/undefined as empty string, sorted first in asc', () => {
      const result = [{ items: [{ val: 'a' }, { val: null }, { val: 'b' }, { val: undefined }] }];
      const sorted = relationsOrder(result, [{ name: 'items', order: 'val' }]);
      const vals = sorted[0].items.map((i: any) => i.val);
      expect(vals[0]).toBe(null);
      expect(vals[1]).toBe(undefined);
      expect(vals[2]).toBe('a');
      expect(vals[3]).toBe('b');
    });

    it('parses numeric strings as numbers', () => {
      const result = [{ items: [{ val: '10' }, { val: '2' }, { val: '1' }] }];
      const sorted = relationsOrder(result, [{ name: 'items', order: 'val' }]);
      expect(sorted[0].items.map((i: any) => i.val)).toEqual(['1', '2', '10']);
    });
  });

  describe('relationsOrder behavior', () => {
    it('returns result unchanged when relations is null', () => {
      const result = [{ id: 1 }];
      const sorted = relationsOrder(result, null as any);
      expect(sorted).toBe(result);
    });

    it('returns result unchanged when relations is empty array', () => {
      const result = [{ id: 1 }];
      const sorted = relationsOrder(result, []);
      expect(sorted).toBe(result);
    });

    it('sorts array by single field', () => {
      const result = [{ tags: [{ pos: 2 }, { pos: 1 }, { pos: 3 }] }];
      const sorted = relationsOrder(result, [{ name: 'tags', order: 'pos' }]);
      expect(sorted[0].tags.map((t: any) => t.pos)).toEqual([1, 2, 3]);
    });

    it('applies sorts in order (first sort, then second)', () => {
      const result = [{ items: [{ cat: 'b', sub: 2 }, { cat: 'a', sub: 2 }, { cat: 'a', sub: 1 }] }];
      const sorted = relationsOrder(result, [
        { name: 'items', order: 'cat' },
        { name: 'items', order: 'sub' },
      ]);
      expect(sorted[0].items.map((i: any) => ({ cat: i.cat, sub: i.sub }))).toEqual([
        { cat: 'a', sub: 1 },
        { cat: 'a', sub: 2 },
        { cat: 'b', sub: 2 },
      ]);
    });

    it('sorts nested relation by one level', () => {
      const result = [{ posts: [{ position: 3 }, { position: 1 }, { position: 2 }] }];
      const sorted = relationsOrder(result, [{ name: 'posts', order: 'position' }]);
      expect(sorted[0].posts.map((p: any) => p.position)).toEqual([1, 2, 3]);
    });

    it('sorts deep nested (two levels)', () => {
      const result = [{ user: { posts: [{ createdAt: new Date('2025-03-01') }, { createdAt: new Date('2025-01-01') }, { createdAt: new Date('2025-02-01') }] } }];
      const sorted = relationsOrder(result, [{ name: 'user.posts', order: 'createdAt' }]);
      expect(sorted[0].user.posts[0].createdAt).toEqual(new Date('2025-01-01'));
      expect(sorted[0].user.posts[2].createdAt).toEqual(new Date('2025-03-01'));
    });

    it('skips when order is empty', () => {
      const result = [{ items: [{ val: 3 }, { val: 1 }] }];
      const sorted = relationsOrder(result, [{ name: 'items', order: '' }]);
      expect(sorted[0].items.map((i: any) => i.val)).toEqual([3, 1]);
    });

    it('skips when name is empty', () => {
      const result = [{ items: [{ val: 3 }, { val: 1 }] }];
      const sorted = relationsOrder(result, [{ name: '', order: 'val' }]);
      expect(sorted[0].items.map((i: any) => i.val)).toEqual([3, 1]);
    });

    it('skips when target is not an array', () => {
      const result = [{ count: 42 }];
      const sorted = relationsOrder(result, [{ name: 'count', order: 'something' }]);
      expect(sorted[0].count).toBe(42);
    });
  });
});
