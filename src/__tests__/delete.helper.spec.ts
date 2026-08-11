import 'reflect-metadata';
import { softRemove, hardRemove, restoreDeleted } from '../common/service/delete.helper';
import { Repository } from 'typeorm';

const createMockRepo = (updateResult = { affected: 1 }, deleteResult = { affected: 1 }) =>
  ({
    update: jest.fn().mockResolvedValue(updateResult),
    delete: jest.fn().mockResolvedValue(deleteResult),
  } as unknown as Repository<any>);

describe('delete.helper', () => {
  describe('softRemove', () => {
    it('sets soft delete column to current date and returns true', async () => {
      const repo = createMockRepo();
      const result = await softRemove(repo, 1, 'deletedAt');
      expect(repo.update).toHaveBeenCalledWith(1, expect.objectContaining({ deletedAt: expect.any(Date) }));
      expect(result).toBe(true);
    });

    it('returns false when affected is 0', async () => {
      const repo = createMockRepo({ affected: 0 });
      const result = await softRemove(repo, 999, 'deletedAt');
      expect(result).toBe(false);
    });

    it('returns false when result is null', async () => {
      const repo = createMockRepo(null);
      const result = await softRemove(repo, 999, 'deletedAt');
      expect(result).toBe(false);
    });

    it('works with string id', async () => {
      const repo = createMockRepo();
      await softRemove(repo, 'abc', 'deletedAt');
      expect(repo.update).toHaveBeenCalledWith('abc', expect.any(Object));
    });
  });

  describe('hardRemove', () => {
    it('deletes by id and returns true', async () => {
      const repo = createMockRepo();
      const result = await hardRemove(repo, 1);
      expect(repo.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('returns false when affected is 0', async () => {
      const repo = createMockRepo(undefined, { affected: 0 });
      const result = await hardRemove(repo, 999);
      expect(result).toBe(false);
    });

    it('returns false when result is null', async () => {
      const repo = createMockRepo(undefined, null);
      const result = await hardRemove(repo, 999);
      expect(result).toBe(false);
    });
  });

  describe('restoreDeleted', () => {
    it('sets soft delete column to null and returns true', async () => {
      const repo = createMockRepo();
      const result = await restoreDeleted(repo, 1, 'deletedAt');
      expect(repo.update).toHaveBeenCalledWith(1, { deletedAt: null });
      expect(result).toBe(true);
    });

    it('returns false when affected is 0', async () => {
      const repo = createMockRepo({ affected: 0 });
      const result = await restoreDeleted(repo, 999, 'deletedAt');
      expect(result).toBe(false);
    });

    it('returns false when result is null', async () => {
      const repo = createMockRepo(null);
      const result = await restoreDeleted(repo, 999, 'deletedAt');
      expect(result).toBe(false);
    });
  });
});
