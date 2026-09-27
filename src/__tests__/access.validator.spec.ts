import 'reflect-metadata';
import { EntityMetadata } from 'typeorm';
import { validateEntityAccess } from '../common/access.validator';
import { EntityAccessConfig } from '../common/access.rules';

function createMetadata(): EntityMetadata {
  class Course {}
  class Author {}
  class Tenant {}
  return {
    name: 'Course',
    target: Course,
    columns: [
      { propertyName: 'id' },
      { propertyName: 'title' },
      { propertyName: 'published' },
      { propertyName: 'price' },
    ],
    relations: [
      {
        propertyName: 'author',
        inverseEntityMetadata: { name: 'Author', target: Author, columns: [{ propertyName: 'id' }], relations: [] },
      },
      {
        propertyName: 'tenant',
        inverseEntityMetadata: { name: 'Tenant', target: Tenant, columns: [{ propertyName: 'id' }], relations: [] },
      },
    ],
  } as unknown as EntityMetadata;
}

describe('access.validator', () => {
  it('valid config produces no errors', () => {
    const config: EntityAccessConfig = {
      operations: {
        read: [
          { who: ['public'], filter: { published: true } },
          { who: ['authenticated'], scope: { tenant: 'tenant.id' } },
        ],
        update: [{ who: ['authenticated'], scope: { owner: 'author.id' } }, { who: ['moderator'] }],
      },
      fields: {
        price: { response: [{ who: ['accountant'] }] },
        author: { response: [{ who: ['authenticated'] }] },
      },
    };
    expect(validateEntityAccess(createMetadata(), config)).toEqual([]);
  });

  it('validates owner scope path against relations', () => {
    const config: EntityAccessConfig = {
      operations: { update: [{ who: ['authenticated'], scope: { owner: 'auctor.id' } }] },
    };
    const errors = validateEntityAccess(createMetadata(), config);
    expect(errors[0]).toContain("relation 'auctor' not found");
  });

  it('validates last path segment is a column on target', () => {
    const config: EntityAccessConfig = {
      operations: { read: [{ who: ['authenticated'], scope: { tenant: 'author.nope' } }] },
    };
    const errors = validateEntityAccess(createMetadata(), config);
    expect(errors[0]).toContain("'nope' not found");
  });

  it('accepts relation as last segment when target has id', () => {
    const config: EntityAccessConfig = {
      operations: { read: [{ who: ['authenticated'], scope: { owner: 'author' } }] },
    };
    expect(validateEntityAccess(createMetadata(), config)).toEqual([]);
  });

  it('accepts own id column as owner scope', () => {
    const config: EntityAccessConfig = {
      operations: { read: [{ who: ['authenticated'], scope: { owner: 'id' } }] },
    };
    expect(validateEntityAccess(createMetadata(), config)).toEqual([]);
  });

  it('rejects invalid scope shape', () => {
    const config = {
      operations: { read: [{ who: ['authenticated'], scope: { foo: 'bar' } } as any] },
    };
    const errors = validateEntityAccess(createMetadata(), config);
    expect(errors[0]).toContain("scope must be 'all' | { tenant: path } | { owner: path }");
  });

  it('rejects non-string path', () => {
    const config = {
      operations: { read: [{ who: ['authenticated'], scope: { owner: 42 } as any }] },
    };
    const errors = validateEntityAccess(createMetadata(), config);
    expect(errors[0]).toContain('invalid path');
  });

  it('rejects scope in field rules', () => {
    const config: EntityAccessConfig = {
      fields: {
        title: { response: [{ who: ['authenticated'], scope: { owner: 'author.id' } }] },
      },
    };
    const errors = validateEntityAccess(createMetadata(), config);
    expect(errors[0]).toContain('scope is not supported in field rules');
  });

  it('rejects unknown field name', () => {
    const config: EntityAccessConfig = {
      fields: {
        nope: { response: [{ who: ['accountant'] }] },
      },
    };
    const errors = validateEntityAccess(createMetadata(), config);
    expect(errors[0]).toContain("'nope' is not a column or relation");
  });

  it('rejects unknown filter key', () => {
    const config: EntityAccessConfig = {
      operations: { read: [{ who: ['public'], filter: { nope: true } }] },
    };
    const errors = validateEntityAccess(createMetadata(), config);
    expect(errors[0]).toContain("'nope' is not a column or relation");
  });

  it('rejects malformed who entry', () => {
    const config = {
      operations: { read: [{ who: ['bad role!'] as any }] },
    };
    const errors = validateEntityAccess(createMetadata(), config);
    expect(errors[0]).toContain('must be a role name');
  });
});
