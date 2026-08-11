import 'reflect-metadata';
import { getUniqueColumns, findUniqueEntry } from '../common/service/unique.helper';
import { EntityMetadata } from 'typeorm';

const createMockIndex = (isUnique: boolean, columns: Array<{ propertyName: string }>) => ({
  isUnique,
  columns,
});

const createMockMetadata = (indices: any[] = []) =>
  ({ indices } as unknown as EntityMetadata);

describe('unique.helper', () => {
  describe('getUniqueColumns', () => {
    it('returns empty array when no unique indices exist', () => {
      const metadata = createMockMetadata([
        createMockIndex(false, [{ propertyName: 'name' }]),
      ]);
      expect(getUniqueColumns(metadata)).toEqual([]);
    });

    it('returns column names for unique indices', () => {
      const metadata = createMockMetadata([
        createMockIndex(true, [{ propertyName: 'email' }]),
        createMockIndex(false, [{ propertyName: 'name' }]),
      ]);
      expect(getUniqueColumns(metadata)).toEqual([['email']]);
    });

    it('returns multiple unique groups', () => {
      const metadata = createMockMetadata([
        createMockIndex(true, [{ propertyName: 'email' }]),
        createMockIndex(true, [{ propertyName: 'tenantId' }, { propertyName: 'userId' }]),
      ]);
      expect(getUniqueColumns(metadata)).toEqual([['email'], ['tenantId', 'userId']]);
    });

    it('skips unique indices with empty columns', () => {
      const metadata = createMockMetadata([
        createMockIndex(true, []),
        createMockIndex(true, [{ propertyName: 'slug' }]),
      ]);
      expect(getUniqueColumns(metadata)).toEqual([['slug']]);
    });

    it('skips columns with falsy propertyName', () => {
      const metadata = createMockMetadata([
        createMockIndex(true, [{ propertyName: '' }, { propertyName: 'code' }]),
      ]);
      expect(getUniqueColumns(metadata)).toEqual([['code']]);
    });

    it('returns empty array when indices is empty', () => {
      const metadata = createMockMetadata([]);
      expect(getUniqueColumns(metadata)).toEqual([]);
    });
  });

  describe('findUniqueEntry', () => {
    it('returns null when no unique indices', async () => {
      const repo = { metadata: createMockMetadata([]), findOne: jest.fn() };
      const result = await findUniqueEntry(repo as any, { email: 'a@b.com' });
      expect(result).toBeNull();
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it('returns null when entity fields do not match unique columns', async () => {
      const repo = {
        metadata: createMockMetadata([
          createMockIndex(true, [{ propertyName: 'email' }, { propertyName: 'tenantId' }]),
        ]),
        findOne: jest.fn(),
      };
      const result = await findUniqueEntry(repo as any, { email: 'a@b.com' });
      expect(result).toBeNull();
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it('finds entry by single unique column', async () => {
      const existing = { id: 42 };
      const repo = {
        metadata: createMockMetadata([
          createMockIndex(true, [{ propertyName: 'email' }]),
        ]),
        findOne: jest.fn().mockResolvedValue(existing),
      };
      const result = await findUniqueEntry(repo as any, { email: 'a@b.com', name: 'test' });
      expect(result).toEqual(existing);
      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'a@b.com' } }),
      );
    });

    it('finds entry by composite unique columns', async () => {
      const existing = { id: 7 };
      const repo = {
        metadata: createMockMetadata([
          createMockIndex(true, [{ propertyName: 'tenantId' }, { propertyName: 'userId' }]),
        ]),
        findOne: jest.fn().mockResolvedValue(existing),
      };
      const result = await findUniqueEntry(repo as any, { tenantId: 1, userId: 2 });
      expect(result).toEqual(existing);
      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 1, userId: 2 } }),
      );
    });

    it('returns null when findOne returns null', async () => {
      const repo = {
        metadata: createMockMetadata([
          createMockIndex(true, [{ propertyName: 'email' }]),
        ]),
        findOne: jest.fn().mockResolvedValue(null),
      };
      const result = await findUniqueEntry(repo as any, { email: 'a@b.com' });
      expect(result).toBeNull();
    });

    it('tries first matching unique group that has all fields', async () => {
      const existing = { id: 1 };
      const repo = {
        metadata: createMockMetadata([
          createMockIndex(true, [{ propertyName: 'email' }, { propertyName: 'tenantId' }]),
          createMockIndex(true, [{ propertyName: 'slug' }]),
        ]),
        findOne: jest.fn().mockResolvedValue(existing),
      };
      const result = await findUniqueEntry(repo as any, { slug: 'hello' });
      expect(result).toEqual(existing);
      expect(repo.findOne).toHaveBeenCalledTimes(1);
      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: 'hello' } }),
      );
    });
  });
});
