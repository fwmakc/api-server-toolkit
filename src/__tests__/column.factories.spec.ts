import 'reflect-metadata';

const mockColumnFn = jest.fn();
const mockPrimaryGeneratedColumnFn = jest.fn();
const mockCreateDateColumnFn = jest.fn();
const mockUpdateDateColumnFn = jest.fn();
const mockIndexFn = jest.fn();
const mockIndexDecorator = jest.fn();

jest.mock('typeorm', () => ({
  Column: (...args: any[]) => {
    mockColumnFn(...args);
    return jest.fn();
  },
  PrimaryGeneratedColumn: (...args: any[]) => {
    mockPrimaryGeneratedColumnFn(...args);
    return jest.fn();
  },
  CreateDateColumn: (...args: any[]) => {
    mockCreateDateColumnFn(...args);
    return jest.fn();
  },
  UpdateDateColumn: (...args: any[]) => {
    mockUpdateDateColumnFn(...args);
    return jest.fn();
  },
  Index: (...args: any[]) => {
    mockIndexFn(...args);
    return mockIndexDecorator;
  },
}));

import {
  IdColumn,
  VarcharColumn,
  TextColumn,
  IntColumn,
  SmallIntColumn,
  BigIntColumn,
  FloatColumn,
  BooleanColumn,
  DateColumn,
  JsonColumn,
  CreatedColumn,
  UpdatedColumn,
  EnumColumn,
  PositionAscColumn,
  PositionDescColumn,
} from '../common/common.column';
import { IndexedColumn } from '../common/column/indexed.column';

beforeEach(() => {
  mockColumnFn.mockClear();
  mockPrimaryGeneratedColumnFn.mockClear();
  mockCreateDateColumnFn.mockClear();
  mockUpdateDateColumnFn.mockClear();
  mockIndexFn.mockClear();
  mockIndexDecorator.mockClear();
});

describe('IdColumn', () => {
  it('creates bigint primary key by default', () => {
    class TestEntity {
      @IdColumn() id: number;
    }
    expect(mockPrimaryGeneratedColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      name: 'id',
      type: 'bigint',
      unsigned: true,
    });
  });

  it('creates int primary key when type=int', () => {
    class TestEntity {
      @IdColumn('int') id: number;
    }
    expect(mockPrimaryGeneratedColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      name: 'id',
      type: 'int',
      unsigned: true,
    });
  });

  it('passes comment option', () => {
    class TestEntity {
      @IdColumn('bigint', 'primary key') id: number;
    }
    expect(mockPrimaryGeneratedColumnFn).toHaveBeenCalledWith({
      comment: 'primary key',
      name: 'id',
      type: 'bigint',
      unsigned: true,
    });
  });
});

describe('VarcharColumn', () => {
  it('creates varchar column with default length 255', () => {
    class TestEntity {
      @VarcharColumn('title') title: string;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: '',
      name: 'title',
      nullable: true,
      length: 255,
      transformer: undefined,
      type: 'varchar',
    });
  });

  it('creates varchar with tiny length=15', () => {
    class TestEntity {
      @VarcharColumn('slug', 'tiny') slug: string;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ length: 15 }),
    );
  });

  it('creates varchar with medium length=1023', () => {
    class TestEntity {
      @VarcharColumn('body', 'medium') body: string;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ length: 1023 }),
    );
  });

  it('creates varchar with long length=2047', () => {
    class TestEntity {
      @VarcharColumn('content', 'long') content: string;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ length: 2047 }),
    );
  });

  it('creates varchar with numeric length', () => {
    class TestEntity {
      @VarcharColumn('code', 50) code: string;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ length: 50 }),
    );
  });

  it('creates varchar with comment and index options', () => {
    class TestEntity {
      @VarcharColumn('name', 255, { comment: 'test', index: true }) name: string;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'test' }),
    );
    expect(mockIndexFn).toHaveBeenCalledWith();
    expect(mockIndexDecorator).toHaveBeenCalled();
  });

  it('creates varchar with unique index', () => {
    class TestEntity {
      @VarcharColumn('email', 255, { index: 'unique' }) email: string;
    }
    expect(mockIndexFn).toHaveBeenCalledWith({ unique: true });
    expect(mockIndexDecorator).toHaveBeenCalled();
  });

  it('creates varchar with clear option and transformer', () => {
    class TestEntity {
      @VarcharColumn('slug', 255, { clear: '[^a-z]' }) slug: string;
    }
    const call = mockColumnFn.mock.calls[0][0];
    expect(call.transformer).toBeDefined();
    expect(call.transformer.to('Hello-World!')).toBe('HelloWorld');
    expect(call.transformer.from('test')).toBe('test');
  });
});

describe('TextColumn', () => {
  it('creates text column with default options', () => {
    class TestEntity {
      @TextColumn('description') description: string;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: null,
      name: 'description',
      nullable: true,
      transformer: expect.any(Object),
      type: 'text',
    });
  });

  it('creates text column with comment and index', () => {
    class TestEntity {
      @TextColumn('body', { comment: 'main body', index: true }) body: string;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'main body' }),
    );
    expect(mockIndexFn).toHaveBeenCalledWith();
  });

  it('transforms empty string to null on to()', () => {
    class TestEntity {
      @TextColumn('content') content: string;
    }
    const transformer = mockColumnFn.mock.calls[0][0].transformer;
    expect(transformer.to('')).toBeNull();
    expect(transformer.to('hello')).toBe('hello');
    expect(transformer.from('')).toBe('');
    expect(transformer.from(null)).toBe('');
  });
});

describe('IntColumn', () => {
  it('creates int column with default value 0', () => {
    class TestEntity {
      @IntColumn('count') count: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: 0,
      name: 'count',
      transformer: expect.any(Object),
      type: 'int',
    });
  });

  it('creates int column with custom value', () => {
    class TestEntity {
      @IntColumn('age', 18) age: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ default: 18 }),
    );
  });

  it('creates int column with nullable, unsigned, width options', () => {
    class TestEntity {
      @IntColumn('amount', 0, { nullable: true, unsigned: true, width: 4 })
      amount: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: 0,
      name: 'amount',
      transformer: expect.any(Object),
      type: 'int',
      nullable: true,
      unsigned: true,
      width: 4,
    });
  });

  it('creates int column with index', () => {
    class TestEntity {
      @IntColumn('score', 0, { index: true }) score: number;
    }
    expect(mockIndexFn).toHaveBeenCalledWith();
  });

  it('parses string to int on from()', () => {
    class TestEntity {
      @IntColumn('val') val: number;
    }
    const transformer = mockColumnFn.mock.calls[0][0].transformer;
    expect(transformer.to(42)).toBe(42);
    expect(transformer.from('123')).toBe(123);
    expect(transformer.from('abc')).toBeNaN();
  });
});

describe('SmallIntColumn', () => {
  it('creates smallint column with default value 0', () => {
    class TestEntity {
      @SmallIntColumn('priority') priority: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: 0,
      name: 'priority',
      transformer: expect.any(Object),
      type: 'smallint',
    });
  });

  it('creates smallint with custom value and options', () => {
    class TestEntity {
      @SmallIntColumn('level', 5, { nullable: true, unsigned: true, width: 2 })
      level: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: 5,
      name: 'level',
      transformer: expect.any(Object),
      type: 'smallint',
      nullable: true,
      unsigned: true,
      width: 2,
    });
  });

  it('parses string to int on from()', () => {
    class TestEntity {
      @SmallIntColumn('val') val: number;
    }
    const transformer = mockColumnFn.mock.calls[0][0].transformer;
    expect(transformer.from('10')).toBe(10);
  });
});

describe('BigIntColumn', () => {
  it('creates bigint column with default value 0', () => {
    class TestEntity {
      @BigIntColumn('total') total: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: 0,
      name: 'total',
      transformer: expect.any(Object),
      type: 'bigint',
    });
  });

  it('creates bigint with custom value and options', () => {
    class TestEntity {
      @BigIntColumn('bytes', 1024, { nullable: true, unsigned: true })
      bytes: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: 1024,
      name: 'bytes',
      transformer: expect.any(Object),
      type: 'bigint',
      nullable: true,
      unsigned: true,
    });
  });

  it('returns string from from()', () => {
    class TestEntity {
      @BigIntColumn('big') big: number;
    }
    const transformer = mockColumnFn.mock.calls[0][0].transformer;
    expect(transformer.to(999)).toBe(999);
    expect(transformer.from('999')).toBe('999');
  });
});

describe('FloatColumn', () => {
  it('creates decimal column with default value 0', () => {
    class TestEntity {
      @FloatColumn('price') price: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: 0,
      name: 'price',
      nullable: false,
      precision: 15,
      scale: 2,
      transformer: expect.any(Object),
      type: 'decimal',
    });
  });

  it('creates decimal column with custom value', () => {
    class TestEntity {
      @FloatColumn('rate', 3.5) rate: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ default: 3.5 }),
    );
  });

  it('creates decimal with custom precision and scale', () => {
    class TestEntity {
      @FloatColumn('amount', 0, { precision: 10, scale: 4 })
      amount: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ precision: 10, scale: 4 }),
    );
  });

  it('creates decimal with nullable option', () => {
    class TestEntity {
      @FloatColumn('discount', 0, { nullable: true }) discount: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ nullable: true }),
    );
  });

  it('parses float on from()', () => {
    class TestEntity {
      @FloatColumn('val') val: number;
    }
    const transformer = mockColumnFn.mock.calls[0][0].transformer;
    expect(transformer.to(1.5)).toBe(1.5);
    expect(transformer.from('3.14')).toBe(3.14);
  });
});

describe('BooleanColumn', () => {
  it('creates smallint column with default 0 when value=false', () => {
    class TestEntity {
      @BooleanColumn('active') active: boolean;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: 0,
      name: 'active',
      transformer: expect.any(Object),
      type: 'smallint',
      width: 1,
    });
  });

  it('creates smallint column with default 1 when value=true', () => {
    class TestEntity {
      @BooleanColumn('is_admin', true) isAdmin: boolean;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ default: 1 }),
    );
  });

  it('transforms boolean to smallint on to()', () => {
    class TestEntity {
      @BooleanColumn('flag') flag: boolean;
    }
    const transformer = mockColumnFn.mock.calls[0][0].transformer;
    expect(transformer.to(true)).toBe(1);
    expect(transformer.to(false)).toBe(0);
    expect(transformer.to(5)).toBe(1);
    expect(transformer.to(-1)).toBe(0);
  });

  it('transforms smallint to boolean on from()', () => {
    class TestEntity {
      @BooleanColumn('flag') flag: boolean;
    }
    const transformer = mockColumnFn.mock.calls[0][0].transformer;
    expect(transformer.from(1)).toBe(true);
    expect(transformer.from(0)).toBe(false);
  });
});

describe('DateColumn', () => {
  it('creates timestamp column with nullable true', () => {
    class TestEntity {
      @DateColumn('birthday') birthday: Date;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      name: 'birthday',
      nullable: true,
      type: 'timestamp',
    });
  });

  it('creates timestamp with comment option', () => {
    class TestEntity {
      @DateColumn('deleted_at', { comment: 'soft delete' }) deletedAt: Date;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'soft delete' }),
    );
  });

  it('creates timestamp with index', () => {
    class TestEntity {
      @DateColumn('created', { index: true }) created: Date;
    }
    expect(mockIndexFn).toHaveBeenCalledWith();
  });
});

describe('JsonColumn', () => {
  it('creates json column with default null', () => {
    class TestEntity {
      @JsonColumn('metadata') metadata: any;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: null,
      name: 'metadata',
      nullable: true,
      type: 'json',
    });
  });

  it('creates json column with comment and unique index', () => {
    class TestEntity {
      @JsonColumn('settings', { comment: 'user settings', index: 'unique' })
      settings: any;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'user settings' }),
    );
    expect(mockIndexFn).toHaveBeenCalledWith({ unique: true });
  });
});

describe('CreatedColumn', () => {
  it('creates created_at date column by default', () => {
    class TestEntity {
      @CreatedColumn() createdAt: Date;
    }
    expect(mockCreateDateColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      name: 'created_at',
    });
  });

  it('creates created column with custom name', () => {
    class TestEntity {
      @CreatedColumn('inserted_at') insertedAt: Date;
    }
    expect(mockCreateDateColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      name: 'inserted_at',
    });
  });

  it('creates created column with comment and index', () => {
    class TestEntity {
      @CreatedColumn('created_at', { comment: 'creation time', index: true })
      createdAt: Date;
    }
    expect(mockCreateDateColumnFn).toHaveBeenCalledWith({
      comment: 'creation time',
      name: 'created_at',
    });
    expect(mockIndexFn).toHaveBeenCalledWith();
  });
});

describe('UpdatedColumn', () => {
  it('creates updated_at date column by default', () => {
    class TestEntity {
      @UpdatedColumn() updatedAt: Date;
    }
    expect(mockUpdateDateColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      name: 'updated_at',
    });
  });

  it('creates updated column with custom name', () => {
    class TestEntity {
      @UpdatedColumn('modified_at') modifiedAt: Date;
    }
    expect(mockUpdateDateColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      name: 'modified_at',
    });
  });

  it('creates updated column with comment and unique index', () => {
    class TestEntity {
      @UpdatedColumn('updated_at', { comment: 'last modified', index: 'unique' })
      updatedAt: Date;
    }
    expect(mockUpdateDateColumnFn).toHaveBeenCalledWith({
      comment: 'last modified',
      name: 'updated_at',
    });
    expect(mockIndexFn).toHaveBeenCalledWith({ unique: true });
  });
});

describe('EnumColumn', () => {
  it('creates enum column with given values', () => {
    class TestEntity {
      @EnumColumn('status', ['active', 'inactive']) status: string;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: null,
      enum: ['active', 'inactive'],
      name: 'status',
      nullable: true,
      type: 'enum',
    });
  });

  it('creates enum column with default value', () => {
    class TestEntity {
      @EnumColumn('role', ['admin', 'user'], 'user') role: string;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ default: 'user' }),
    );
  });

  it('creates enum column with comment and index', () => {
    class TestEntity {
      @EnumColumn('type', ['a', 'b'], 'a', { comment: 'type field', index: true })
      type: string;
    }
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'type field' }),
    );
    expect(mockIndexFn).toHaveBeenCalledWith();
  });
});

describe('IndexedColumn', () => {
  it('creates unique index when index=unique', () => {
    class TestEntity {
      @IndexedColumn('unique') email: string;
    }
    expect(mockIndexFn).toHaveBeenCalledWith({ unique: true });
    expect(mockIndexDecorator).toHaveBeenCalled();
  });

  it('creates plain index when index is truthy but not unique', () => {
    class TestEntity {
      @IndexedColumn('index') name: string;
    }
    expect(mockIndexFn).toHaveBeenCalledWith();
    expect(mockIndexDecorator).toHaveBeenCalled();
  });

  it('creates plain index when no argument', () => {
    class TestEntity {
      @IndexedColumn() field: string;
    }
    expect(mockIndexFn).toHaveBeenCalledWith();
    expect(mockIndexDecorator).toHaveBeenCalled();
  });
});

describe('PositionAscColumn', () => {
  it('creates int column with default 2147483647 unsigned', () => {
    class TestEntity {
      @PositionAscColumn() position: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: 2147483647,
      name: 'position',
      nullable: true,
      type: 'int',
      unsigned: true,
    });
  });

  it('creates position asc with custom name and comment', () => {
    class TestEntity {
      @PositionAscColumn('sort_order', { comment: 'sort order' })
      sortOrder: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: 'sort order',
      default: 2147483647,
      name: 'sort_order',
      nullable: true,
      type: 'int',
      unsigned: true,
    });
  });

  it('creates position asc with index', () => {
    class TestEntity {
      @PositionAscColumn('pos', { index: true }) pos: number;
    }
    expect(mockIndexFn).toHaveBeenCalledWith();
  });
});

describe('PositionDescColumn', () => {
  it('creates int column with default 0 unsigned', () => {
    class TestEntity {
      @PositionDescColumn() position: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: 0,
      name: 'position',
      nullable: true,
      type: 'int',
      unsigned: true,
    });
  });

  it('creates position desc with custom name and comment', () => {
    class TestEntity {
      @PositionDescColumn('rank', { comment: 'ranking' }) rank: number;
    }
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: 'ranking',
      default: 0,
      name: 'rank',
      nullable: true,
      type: 'int',
      unsigned: true,
    });
  });

  it('creates position desc with unique index', () => {
    class TestEntity {
      @PositionDescColumn('rank', { index: 'unique' }) rank: number;
    }
    expect(mockIndexFn).toHaveBeenCalledWith({ unique: true });
  });
});
