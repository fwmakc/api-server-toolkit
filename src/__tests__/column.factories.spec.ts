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

function applyDecorator(Decorator: PropertyDecorator): void {
  class _D { @Decorator _d: any; }
  void _D;
}

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
    applyDecorator(IdColumn());
    expect(mockPrimaryGeneratedColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      name: 'id',
      type: 'bigint',
      unsigned: true,
    });
  });

  it('creates int primary key when type=int', () => {
    applyDecorator(IdColumn('int'));
    expect(mockPrimaryGeneratedColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      name: 'id',
      type: 'int',
      unsigned: true,
    });
  });

  it('passes comment option', () => {
    applyDecorator(IdColumn('bigint', 'primary key'));
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
    applyDecorator(VarcharColumn('title'));
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
    applyDecorator(VarcharColumn('slug', 'tiny'));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ length: 15 }),
    );
  });

  it('creates varchar with medium length=1023', () => {
    applyDecorator(VarcharColumn('body', 'medium'));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ length: 1023 }),
    );
  });

  it('creates varchar with long length=2047', () => {
    applyDecorator(VarcharColumn('content', 'long'));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ length: 2047 }),
    );
  });

  it('creates varchar with numeric length', () => {
    applyDecorator(VarcharColumn('code', 50));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ length: 50 }),
    );
  });

  it('creates varchar with comment and index options', () => {
    applyDecorator(VarcharColumn('name', 255, { comment: 'test', index: true }));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'test' }),
    );
    expect(mockIndexFn).toHaveBeenCalledWith();
    expect(mockIndexDecorator).toHaveBeenCalled();
  });

  it('creates varchar with unique index', () => {
    applyDecorator(VarcharColumn('email', 255, { index: 'unique' }));
    expect(mockIndexFn).toHaveBeenCalledWith({ unique: true });
    expect(mockIndexDecorator).toHaveBeenCalled();
  });

  it('creates varchar with clear option and transformer', () => {
    applyDecorator(VarcharColumn('slug', 255, { clear: '[^a-z]' }));
    const call = mockColumnFn.mock.calls[0][0];
    expect(call.transformer).toBeDefined();
    expect(call.transformer.to('Hello-World!')).toBe('HelloWorld');
    expect(call.transformer.from('test')).toBe('test');
  });
});

describe('TextColumn', () => {
  it('creates text column with default options', () => {
    applyDecorator(TextColumn('description'));
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
    applyDecorator(TextColumn('body', { comment: 'main body', index: true }));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'main body' }),
    );
    expect(mockIndexFn).toHaveBeenCalledWith();
  });

  it('transforms empty string to null on to()', () => {
    applyDecorator(TextColumn('content'));
    const transformer = mockColumnFn.mock.calls[0][0].transformer;
    expect(transformer.to('')).toBeNull();
    expect(transformer.to('hello')).toBe('hello');
    expect(transformer.from('')).toBe('');
    expect(transformer.from(null)).toBe('');
  });
});

describe('IntColumn', () => {
  it('creates int column with default value 0', () => {
    applyDecorator(IntColumn('count'));
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: 0,
      name: 'count',
      transformer: expect.any(Object),
      type: 'int',
    });
  });

  it('creates int column with custom value', () => {
    applyDecorator(IntColumn('age', 18));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ default: 18 }),
    );
  });

  it('creates int column with nullable, unsigned, width options', () => {
    applyDecorator(IntColumn('amount', 0, { nullable: true, unsigned: true, width: 4 }));
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
    applyDecorator(IntColumn('score', 0, { index: true }));
    expect(mockIndexFn).toHaveBeenCalledWith();
  });

  it('parses string to int on from()', () => {
    applyDecorator(IntColumn('val'));
    const transformer = mockColumnFn.mock.calls[0][0].transformer;
    expect(transformer.to(42)).toBe(42);
    expect(transformer.from('123')).toBe(123);
    expect(transformer.from('abc')).toBeNaN();
  });
});

describe('SmallIntColumn', () => {
  it('creates smallint column with default value 0', () => {
    applyDecorator(SmallIntColumn('priority'));
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: 0,
      name: 'priority',
      transformer: expect.any(Object),
      type: 'smallint',
    });
  });

  it('creates smallint with custom value and options', () => {
    applyDecorator(SmallIntColumn('level', 5, { nullable: true, unsigned: true, width: 2 }));
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
    applyDecorator(SmallIntColumn('val'));
    const transformer = mockColumnFn.mock.calls[0][0].transformer;
    expect(transformer.from('10')).toBe(10);
  });
});

describe('BigIntColumn', () => {
  it('creates bigint column with default value 0', () => {
    applyDecorator(BigIntColumn('total'));
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: 0,
      name: 'total',
      transformer: expect.any(Object),
      type: 'bigint',
    });
  });

  it('creates bigint with custom value and options', () => {
    applyDecorator(BigIntColumn('bytes', 1024, { nullable: true, unsigned: true }));
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
    applyDecorator(BigIntColumn('big'));
    const transformer = mockColumnFn.mock.calls[0][0].transformer;
    expect(transformer.to(999)).toBe(999);
    expect(transformer.from('999')).toBe('999');
  });
});

describe('FloatColumn', () => {
  it('creates decimal column with default value 0', () => {
    applyDecorator(FloatColumn('price'));
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
    applyDecorator(FloatColumn('rate', 3.5));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ default: 3.5 }),
    );
  });

  it('creates decimal with custom precision and scale', () => {
    applyDecorator(FloatColumn('amount', 0, { precision: 10, scale: 4 }));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ precision: 10, scale: 4 }),
    );
  });

  it('creates decimal with nullable option', () => {
    applyDecorator(FloatColumn('discount', 0, { nullable: true }));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ nullable: true }),
    );
  });

  it('parses float on from()', () => {
    applyDecorator(FloatColumn('val'));
    const transformer = mockColumnFn.mock.calls[0][0].transformer;
    expect(transformer.to(1.5)).toBe(1.5);
    expect(transformer.from('3.14')).toBe(3.14);
  });
});

describe('BooleanColumn', () => {
  it('creates smallint column with default 0 when value=false', () => {
    applyDecorator(BooleanColumn('active'));
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
    applyDecorator(BooleanColumn('is_admin', true));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ default: 1 }),
    );
  });

  it('transforms boolean to smallint on to()', () => {
    applyDecorator(BooleanColumn('flag'));
    const transformer = mockColumnFn.mock.calls[0][0].transformer;
    expect(transformer.to(true)).toBe(1);
    expect(transformer.to(false)).toBe(0);
    expect(transformer.to(5)).toBe(1);
    expect(transformer.to(-1)).toBe(0);
  });

  it('transforms smallint to boolean on from()', () => {
    applyDecorator(BooleanColumn('flag'));
    const transformer = mockColumnFn.mock.calls[0][0].transformer;
    expect(transformer.from(1)).toBe(true);
    expect(transformer.from(0)).toBe(false);
  });
});

describe('DateColumn', () => {
  it('creates timestamp column with nullable true', () => {
    applyDecorator(DateColumn('birthday'));
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      name: 'birthday',
      nullable: true,
      type: 'timestamp',
    });
  });

  it('creates timestamp with comment option', () => {
    applyDecorator(DateColumn('deleted_at', { comment: 'soft delete' }));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'soft delete' }),
    );
  });

  it('creates timestamp with index', () => {
    applyDecorator(DateColumn('created', { index: true }));
    expect(mockIndexFn).toHaveBeenCalledWith();
  });
});

describe('JsonColumn', () => {
  it('creates json column with default null', () => {
    applyDecorator(JsonColumn('metadata'));
    expect(mockColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      default: null,
      name: 'metadata',
      nullable: true,
      type: 'json',
    });
  });

  it('creates json column with comment and unique index', () => {
    applyDecorator(JsonColumn('settings', { comment: 'user settings', index: 'unique' }));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'user settings' }),
    );
    expect(mockIndexFn).toHaveBeenCalledWith({ unique: true });
  });
});

describe('CreatedColumn', () => {
  it('creates created_at date column by default', () => {
    applyDecorator(CreatedColumn());
    expect(mockCreateDateColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      name: 'created_at',
    });
  });

  it('creates created column with custom name', () => {
    applyDecorator(CreatedColumn('inserted_at'));
    expect(mockCreateDateColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      name: 'inserted_at',
    });
  });

  it('creates created column with comment and index', () => {
    applyDecorator(CreatedColumn('created_at', { comment: 'creation time', index: true }));
    expect(mockCreateDateColumnFn).toHaveBeenCalledWith({
      comment: 'creation time',
      name: 'created_at',
    });
    expect(mockIndexFn).toHaveBeenCalledWith();
  });
});

describe('UpdatedColumn', () => {
  it('creates updated_at date column by default', () => {
    applyDecorator(UpdatedColumn());
    expect(mockUpdateDateColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      name: 'updated_at',
    });
  });

  it('creates updated column with custom name', () => {
    applyDecorator(UpdatedColumn('modified_at'));
    expect(mockUpdateDateColumnFn).toHaveBeenCalledWith({
      comment: undefined,
      name: 'modified_at',
    });
  });

  it('creates updated column with comment and unique index', () => {
    applyDecorator(UpdatedColumn('updated_at', { comment: 'last modified', index: 'unique' }));
    expect(mockUpdateDateColumnFn).toHaveBeenCalledWith({
      comment: 'last modified',
      name: 'updated_at',
    });
    expect(mockIndexFn).toHaveBeenCalledWith({ unique: true });
  });
});

describe('EnumColumn', () => {
  it('creates enum column with given values', () => {
    applyDecorator(EnumColumn('status', ['active', 'inactive']));
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
    applyDecorator(EnumColumn('role', ['admin', 'user'], 'user'));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ default: 'user' }),
    );
  });

  it('creates enum column with comment and index', () => {
    applyDecorator(EnumColumn('type', ['a', 'b'], 'a', { comment: 'type field', index: true }));
    expect(mockColumnFn).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'type field' }),
    );
    expect(mockIndexFn).toHaveBeenCalledWith();
  });
});

describe('IndexedColumn', () => {
  it('creates unique index when index=unique', () => {
    applyDecorator(IndexedColumn('unique'));
    expect(mockIndexFn).toHaveBeenCalledWith({ unique: true });
    expect(mockIndexDecorator).toHaveBeenCalled();
  });

  it('creates plain index when index is truthy but not unique', () => {
    applyDecorator(IndexedColumn('index'));
    expect(mockIndexFn).toHaveBeenCalledWith();
    expect(mockIndexDecorator).toHaveBeenCalled();
  });

  it('creates plain index when no argument', () => {
    applyDecorator(IndexedColumn());
    expect(mockIndexFn).toHaveBeenCalledWith();
    expect(mockIndexDecorator).toHaveBeenCalled();
  });
});

describe('PositionAscColumn', () => {
  it('creates int column with default 2147483647 unsigned', () => {
    applyDecorator(PositionAscColumn());
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
    applyDecorator(PositionAscColumn('sort_order', { comment: 'sort order' }));
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
    applyDecorator(PositionAscColumn('pos', { index: true }));
    expect(mockIndexFn).toHaveBeenCalledWith();
  });
});

describe('PositionDescColumn', () => {
  it('creates int column with default 0 unsigned', () => {
    applyDecorator(PositionDescColumn());
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
    applyDecorator(PositionDescColumn('rank', { comment: 'ranking' }));
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
    applyDecorator(PositionDescColumn('rank', { index: 'unique' }));
    expect(mockIndexFn).toHaveBeenCalledWith({ unique: true });
  });
});
