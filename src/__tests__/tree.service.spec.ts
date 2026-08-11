import 'reflect-metadata';
import { treeToFlat, flatToTree } from '../common/service/tree.service';

describe('tree.service', () => {
  describe('treeToFlat', () => {
    it('flattens a simple object', () => {
      const result = treeToFlat({ a: 1, b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('flattens nested object with dot notation', () => {
      const result = treeToFlat({ user: { name: 'test', age: 25 } });
      expect(result).toEqual({ 'user.name': 'test', 'user.age': 25 });
    });

    it('flattens deeply nested object', () => {
      const result = treeToFlat({ a: { b: { c: 1 } } });
      expect(result).toEqual({ 'a.b.c': 1 });
    });

    it('handles arrays as values', () => {
      const result = treeToFlat({ tags: ['a', 'b', 'c'] });
      expect(result).toEqual({ 'tags.0': 'a', 'tags.1': 'b', 'tags.2': 'c' });
    });

    it('handles arrays of objects', () => {
      const result = treeToFlat({ items: [{ name: 'x' }, { name: 'y' }] });
      expect(result).toEqual({ 'items.0.name': 'x', 'items.1.name': 'y' });
    });

    it('handles null values', () => {
      const result = treeToFlat({ a: null, b: { c: null } });
      expect(result).toEqual({ a: null, 'b.c': null });
    });

    it('handles mixed nesting', () => {
      const result = treeToFlat({ a: 1, b: { c: [{ d: 2 }, 3] } });
      expect(result).toEqual({ a: 1, 'b.c.0.d': 2, 'b.c.1': 3 });
    });

    it('flattens an array of objects', () => {
      const result = treeToFlat([{ a: 1 }, { b: 2 }]);
      expect(result).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it('flattens an array of nested objects', () => {
      const result = treeToFlat([{ user: { name: 'a' } }, { user: { name: 'b' } }]);
      expect(result).toEqual([{ 'user.name': 'a' }, { 'user.name': 'b' }]);
    });

    it('handles empty object', () => {
      expect(treeToFlat({})).toEqual({});
    });
  });

  describe('flatToTree', () => {
    it('unflatten a simple flat object', () => {
      const result = flatToTree({ a: 1, b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('unflatten dot-notation keys', () => {
      const result = flatToTree({ 'user.name': 'test', 'user.age': 25 });
      expect(result).toEqual({ user: { name: 'test', age: 25 } });
    });

    it('unflatten deeply nested keys', () => {
      const result = flatToTree({ 'a.b.c': 1 });
      expect(result).toEqual({ a: { b: { c: 1 } } });
    });

    it('unflatten array indices', () => {
      const result = flatToTree({ 'tags.0': 'a', 'tags.1': 'b' });
      expect(result).toEqual({ tags: ['a', 'b'] });
    });

    it('unflatten array of objects', () => {
      const result = flatToTree({ 'items.0.name': 'x', 'items.1.name': 'y' });
      expect(result).toEqual({ items: [{ name: 'x' }, { name: 'y' }] });
    });

    it('unflatten null values', () => {
      const result = flatToTree({ a: null });
      expect(result).toEqual({ a: null });
    });

    it('round-trip: tree → flat → tree', () => {
      const original = { a: 1, b: { c: 2, d: [{ e: 3 }] } };
      const flat = treeToFlat(original);
      const restored = flatToTree(flat);
      expect(restored).toEqual(original);
    });

    it('round-trip: array of objects', () => {
      const original = [{ a: { b: 1 } }, { c: 2 }];
      const flat = treeToFlat(original);
      const restored = flatToTree(flat);
      expect(restored).toEqual(original);
    });

    it('handles array input for flatToTree', () => {
      const result = flatToTree([{ 'a.b': 1 }, { 'c.d': 2 }]);
      expect(result).toEqual([{ a: { b: 1 } }, { c: { d: 2 } }]);
    });

    it('handles empty object', () => {
      expect(flatToTree({})).toEqual({});
    });
  });
});
