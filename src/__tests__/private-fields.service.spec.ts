import { removePrivateFields, stripWriteFields } from '../common/service/private_fields.service';
import { FieldAccess } from '../common/decorator/field_access.decorator';
import 'reflect-metadata';

class TestEntity {
  name: string;

  @FieldAccess({ read: 'public', write: 'public' })
  title: string;

  @FieldAccess({ read: 'superuser', write: 'superuser' })
  secret: string;

  @FieldAccess({ read: 'owner', write: 'owner' })
  privateNote: string;

  @FieldAccess({ read: 'closed', write: 'closed' })
  internalId: string;

  @FieldAccess({ write: 'public', read: 'public' })
  status: string;
}

function makeEntity(overrides: Partial<TestEntity> = {}): TestEntity {
  const e = new TestEntity();
  e.name = 'Alice';
  e.title = 'Hello';
  e.secret = 'top-secret';
  e.privateNote = 'my note';
  e.internalId = 'INT-001';
  e.status = 'active';
  Object.assign(e, overrides);
  return e;
}

describe('removePrivateFields', () => {
  it('removes admin-level fields for non-admin user', () => {
    const entity = makeEntity();
    const bind = { id: 1, name: 'account', allow: false };
    removePrivateFields(entity, bind);
    expect(entity.secret).toBeUndefined();
  });

  it('keeps admin-level fields for admin user (allow=true)', () => {
    const entity = makeEntity();
    const bind = { id: 1, name: 'account', allow: true };
    removePrivateFields(entity, bind);
    expect(entity.secret).toBe('top-secret');
  });

  it('removes closed-level fields for all non-admin', () => {
    const entity = makeEntity();
    const bind = { id: 1, name: 'account', allow: false };
    removePrivateFields(entity, bind);
    expect(entity.internalId).toBeUndefined();
  });

  it('removes closed-level fields even for admin', () => {
    const entity = makeEntity();
    const bind = { id: 1, name: 'account', allow: true };
    removePrivateFields(entity, bind);
    expect(entity.internalId).toBeUndefined();
  });

  it('keeps public fields for all users', () => {
    const entity = makeEntity();
    const bind = { id: 1, name: 'account', allow: false };
    removePrivateFields(entity, bind);
    expect(entity.title).toBe('Hello');
  });

  it('keeps owner-level fields when bind.id matches owner', () => {
    const entity = makeEntity();
    entity['account'] = { id: 42 };
    const bind = { id: 42, name: 'account', allow: false };
    removePrivateFields(entity, bind);
    expect(entity.privateNote).toBe('my note');
  });

  it('removes owner-level fields when bind.id does NOT match', () => {
    const entity = makeEntity();
    entity['account'] = { id: 99 };
    const bind = { id: 42, name: 'account', allow: false };
    removePrivateFields(entity, bind);
    expect(entity.privateNote).toBeUndefined();
  });

  it('removes owner-level fields when owner entity is missing', () => {
    const entity = makeEntity();
    const bind = { id: 42, name: 'account', allow: false };
    removePrivateFields(entity, bind);
    expect(entity.privateNote).toBeUndefined();
  });

  it('handles arrays', () => {
    const entities = [makeEntity(), makeEntity()];
    const bind = { id: 1, name: 'account', allow: false };
    removePrivateFields(entities, bind);
    entities.forEach((e) => {
      expect(e.secret).toBeUndefined();
      expect(e.title).toBe('Hello');
    });
  });

  it('handles null/undefined gracefully', () => {
    expect(() => removePrivateFields(null as any, {})).not.toThrow();
    expect(() => removePrivateFields(undefined as any, {})).not.toThrow();
  });

  it('handles fields without FieldAccess metadata (treats as public)', () => {
    const entity = makeEntity();
    const bind = { id: 1, name: 'account', allow: false };
    removePrivateFields(entity, bind);
    expect(entity.name).toBe('Alice');
  });
});

describe('stripWriteFields', () => {
  it('removes admin write fields for non-admin', () => {
    const dto: any = { title: 'X', secret: 'Y', status: 'Z' };
    stripWriteFields(dto, TestEntity, { id: 1, allow: false });
    expect(dto.secret).toBeUndefined();
  });

  it('keeps admin write fields for admin (allow=true)', () => {
    const dto: any = { title: 'X', secret: 'Y', status: 'Z' };
    stripWriteFields(dto, TestEntity, { id: 1, allow: true });
    expect(dto.secret).toBe('Y');
  });

  it('removes closed write fields even for admin', () => {
    const dto: any = { title: 'X', internalId: 'Y' };
    stripWriteFields(dto, TestEntity, { id: 1, allow: true });
    expect(dto.internalId).toBeUndefined();
  });

  it('keeps public write fields for all users', () => {
    const dto: any = { title: 'X', status: 'Y' };
    stripWriteFields(dto, TestEntity, { id: 1, allow: false });
    expect(dto.title).toBe('X');
    expect(dto.status).toBe('Y');
  });

  it('keeps owner write fields (owner can always write)', () => {
    const dto: any = { privateNote: 'note' };
    stripWriteFields(dto, TestEntity, { id: 1, allow: false });
    expect(dto.privateNote).toBe('note');
  });

  it('force-closes the bind field (user cannot write their own account)', () => {
    const dto: any = { account: 5, title: 'X' };
    stripWriteFields(dto, TestEntity, { id: 1, name: 'account', allow: false });
    expect(dto.account).toBeUndefined();
  });

  it('handles null dto gracefully', () => {
    expect(() => stripWriteFields(null, TestEntity, {})).not.toThrow();
  });

  it('handles entity without prototype', () => {
    const dto: any = { x: 1 };
    expect(() => stripWriteFields(dto, null as any, {})).not.toThrow();
    expect(dto.x).toBe(1);
  });
});
