import 'reflect-metadata';
import { parseWhereObject } from '../common/service/where.service';
import {
  And,
  Any,
  Between,
  FindOperator,
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Or,
  Raw,
} from 'typeorm';

jest.mock('../common/service/like.service', () => ({
  prepareLikeOrm: jest.fn((value) => ({ _like: value })),
}));

import { prepareLikeOrm } from '../common/service/like.service';

describe('where.service', () => {
  describe('parseWhereObject', () => {
    it('returns empty object for null/undefined input', () => {
      expect(parseWhereObject(null as any)).toEqual({});
      expect(parseWhereObject(undefined as any)).toEqual({});
    });

    it('returns empty object for empty input', () => {
      expect(parseWhereObject({})).toEqual({});
    });

    it('passes through simple key-value pairs', () => {
      const result = parseWhereObject({ name: 'test', status: 1 });
      expect(result.name).toBe('test');
      expect(result.status).toBe(1);
    });

    it('applies .null modifier', () => {
      const result = parseWhereObject({ 'deletedAt.null': true });
      expect(result.deletedAt).toBeInstanceOf(FindOperator);
    });

    it('applies .not modifier', () => {
      const result = parseWhereObject({ 'status.not': 'active' });
      expect(result.status).toBeInstanceOf(FindOperator);
    });

    it('applies .in modifier', () => {
      const result = parseWhereObject({ 'role.in': ['admin', 'user'] });
      expect(result.role).toBeInstanceOf(FindOperator);
    });

    it('applies .any modifier', () => {
      const result = parseWhereObject({ 'tags.any': ['a', 'b'] });
      expect(result.tags).toBeInstanceOf(FindOperator);
    });

    it('throws on .any with empty array', () => {
      expect(() => parseWhereObject({ 'tags.any': [] })).toThrow("'any' modifier expects a non-empty array");
    });

    it('applies .between modifier', () => {
      const result = parseWhereObject({ 'age.between': [18, 65] });
      expect(result.age).toBeInstanceOf(FindOperator);
    });

    it('throws on .between with single element', () => {
      expect(() => parseWhereObject({ 'age.between': [18] })).toThrow("'between' modifier expects an array with 2 elements");
    });

    it('applies .less modifier', () => {
      const result = parseWhereObject({ 'age.less': 30 });
      expect(result.age).toBeInstanceOf(FindOperator);
    });

    it('applies .lessOrEqual modifier', () => {
      const result = parseWhereObject({ 'age.lessOrEqual': 30 });
      expect(result.age).toBeInstanceOf(FindOperator);
    });

    it('applies .more modifier', () => {
      const result = parseWhereObject({ 'age.more': 18 });
      expect(result.age).toBeInstanceOf(FindOperator);
    });

    it('applies .moreOrEqual modifier', () => {
      const result = parseWhereObject({ 'age.moreOrEqual': 18 });
      expect(result.age).toBeInstanceOf(FindOperator);
    });

    it('applies .like modifier', () => {
      const result = parseWhereObject({ 'name.like': '%test%' });
      expect(prepareLikeOrm).toHaveBeenCalledWith('%test%');
    });

    it('applies .empty modifier', () => {
      const result = parseWhereObject({ 'field.empty': true });
      expect(result.field).toBeInstanceOf(FindOperator);
    });

    it('applies .boolean modifier — true', () => {
      const result = parseWhereObject({ 'active.boolean': 'true' });
      expect(result.active).toBe(true);
    });

    it('applies .boolean modifier — false', () => {
      const result = parseWhereObject({ 'active.boolean': 'false' });
      expect(result.active).toBe(false);
    });

    it('applies .boolean modifier — numeric 1', () => {
      const result = parseWhereObject({ 'active.boolean': 1 });
      expect(result.active).toBe(true);
    });

    it('applies .number modifier', () => {
      const result = parseWhereObject({ 'amount.number': '42.5' });
      expect(result.amount).toBe(42.5);
    });

    it('applies .string modifier', () => {
      const result = parseWhereObject({ 'code.string': 123 });
      expect(result.code).toBe('123');
    });

    it('applies .search modifier', () => {
      const result = parseWhereObject({ 'name.search': 'hello world' });
      expect(result.name).toBeInstanceOf(FindOperator);
    });

    it('applies .search modifier with empty string returns undefined', () => {
      const result = parseWhereObject({ 'name.search': '' });
      expect(result.name).toBeUndefined();
    });

    it('handles .and modifier with array', () => {
      const result = parseWhereObject({ 'status.and': ['active', 'confirmed'] });
      expect(result.status).toBeInstanceOf(FindOperator);
    });

    it('handles .or modifier with array', () => {
      const result = parseWhereObject({ 'status.or': ['active', 'pending'] });
      expect(result.status).toBeInstanceOf(FindOperator);
    });

    it('skips .and/.or with non-array value', () => {
      const result = parseWhereObject({ 'status.and': 'active' });
      expect(result.status).toBeUndefined();
    });

    it('handles nested objects recursively', () => {
      const result = parseWhereObject({ user: { email: 'test@example.com' } });
      expect(result.user).toEqual({ email: 'test@example.com' });
    });

    it('handles multiple modifiers chained', () => {
      const result = parseWhereObject({ 'status.not': true, 'deletedAt.null': true });
      expect(result.status).toBeInstanceOf(FindOperator);
      expect(result.deletedAt).toBeInstanceOf(FindOperator);
    });

    it('passes through FindOperator values unchanged', () => {
      const op = In(['a', 'b']);
      const result = parseWhereObject({ status: op });
      expect(result.status).toBe(op);
    });

    it('handles multiple keys', () => {
      const result = parseWhereObject({
        name: 'test',
        'age.more': 18,
        'role.in': ['admin'],
      });
      expect(result.name).toBe('test');
      expect(result.age).toBeInstanceOf(FindOperator);
      expect(result.role).toBeInstanceOf(FindOperator);
    });
  });
});
