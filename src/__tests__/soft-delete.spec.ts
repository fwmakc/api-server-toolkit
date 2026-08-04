import 'reflect-metadata';
import { SoftDelete, SOFT_DELETE_METADATA } from '../common/decorator/soft-delete.decorator';
import { getSoftDeleteColumn } from '../common/service/soft-delete.service';

describe('@SoftDelete decorator', () => {
  it('stores column name in metadata', () => {
    class TestEntity {
      @SoftDelete()
      deletedAt: Date;
    }

    const col = Reflect.getMetadata(SOFT_DELETE_METADATA, TestEntity);
    expect(col).toBe('deletedAt');
  });

  it('works with custom column name', () => {
    class TestEntity2 {
      @SoftDelete()
      archivedAt: Date;
    }

    const col = Reflect.getMetadata(SOFT_DELETE_METADATA, TestEntity2);
    expect(col).toBe('archivedAt');
  });

  it('getSoftDeleteColumn returns column name', () => {
    class TestEntity3 {
      @SoftDelete()
      deletedAt: Date;
    }

    expect(getSoftDeleteColumn(TestEntity3)).toBe('deletedAt');
  });

  it('getSoftDeleteColumn returns undefined without decorator', () => {
    class TestEntity4 {
      deletedAt: Date;
    }

    expect(getSoftDeleteColumn(TestEntity4)).toBeUndefined();
  });

  it('getSoftDeleteColumn returns undefined for null/undefined input', () => {
    expect(getSoftDeleteColumn(null)).toBeUndefined();
    expect(getSoftDeleteColumn(undefined)).toBeUndefined();
  });
});
