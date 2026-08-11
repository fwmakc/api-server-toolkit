import 'reflect-metadata';
import { validatePositionField } from '../common/service/position.helper';
import { EntityMetadata } from 'typeorm';

const createMockMetadata = (overrides: any = {}) =>
  ({
    primaryColumns: [{ propertyName: 'id' }],
    columns: [
      { propertyName: 'name' },
      { propertyName: 'position' },
      { propertyName: 'tenantId' },
      { propertyName: 'my_position' },
    ],
    ...overrides,
  } as unknown as EntityMetadata);

describe('position.helper', () => {
  describe('validatePositionField', () => {
    it('throws when field is empty', () => {
      expect(() => validatePositionField(createMockMetadata(), '')).toThrow('Field name is required');
    });

    it('throws when field is not a string', () => {
      expect(() => validatePositionField(createMockMetadata(), 123 as any)).toThrow('Field name is required');
      expect(() => validatePositionField(createMockMetadata(), null as any)).toThrow('Field name is required');
    });

    it('throws when field contains special characters', () => {
      expect(() => validatePositionField(createMockMetadata(), 'my-field')).toThrow('Invalid field name: my-field');
      expect(() => validatePositionField(createMockMetadata(), 'my.field')).toThrow('Invalid field name: my.field');
    });

    it('throws when field is a primary key', () => {
      expect(() => validatePositionField(createMockMetadata(), 'id')).toThrow('Cannot sort by primary key: id');
    });

    it('throws when field does not exist in columns', () => {
      expect(() => validatePositionField(createMockMetadata(), 'unknown')).toThrow('Unknown field: unknown');
    });

    it('passes for valid column name', () => {
      expect(() => validatePositionField(createMockMetadata(), 'position')).not.toThrow();
    });

    it('passes for valid column name with underscores', () => {
      expect(() => validatePositionField(createMockMetadata(), 'my_position')).not.toThrow();
    });
  });
});
