import 'reflect-metadata';
import { AccessLevel } from '../common/access.type';
import { FieldAccess } from '../common/decorator/field_access.decorator';
import { FieldRoles, FIELD_ROLES_METADATA } from '../common/decorator/field_roles.decorator';
import { removePrivateFields, stripWriteFields } from '../common/service/private_fields.service';

describe('@FieldRoles decorator', () => {
  it('sets metadata with read roles', () => {
    class T1 {
      @FieldRoles({ read: ['admin'] })
      secret: string;
    }
    const meta = Reflect.getMetadata(FIELD_ROLES_METADATA, T1.prototype, 'secret');
    expect(meta).toEqual({ read: ['admin'] });
  });

  it('sets metadata with write roles', () => {
    class T2 {
      @FieldRoles({ write: ['admin'] })
      data: string;
    }
    const meta = Reflect.getMetadata(FIELD_ROLES_METADATA, T2.prototype, 'data');
    expect(meta).toEqual({ write: ['admin'] });
  });

  it('sets metadata with both read and write roles', () => {
    class T3 {
      @FieldRoles({ read: ['admin'], write: ['editor'] })
      field: string;
    }
    const meta = Reflect.getMetadata(FIELD_ROLES_METADATA, T3.prototype, 'field');
    expect(meta).toEqual({ read: ['admin'], write: ['editor'] });
  });

  it('FIELD_ROLES_METADATA key is correct', () => {
    expect(FIELD_ROLES_METADATA).toBe('fieldRoles');
  });
});

describe('removePrivateFields — FieldRoles OR with FieldAccess', () => {
  function makeClass(accessRead: AccessLevel, rolesRead?: string[]) {
    class Entity {
      title = 'secret';
    }
    if (accessRead !== undefined) {
      Reflect.defineMetadata('fieldAccess', { read: accessRead }, Entity.prototype, 'title');
    }
    if (rolesRead) {
      Reflect.defineMetadata('fieldRoles', { read: rolesRead }, Entity.prototype, 'title');
    }
    return Entity;
  }

  it('SUPERUSER access + FieldRoles admin — no role, not superuser → removed', () => {
    const Cls = makeClass(AccessLevel.SUPERUSER, ['admin']);
    const entity = new Cls();
    removePrivateFields(entity, { id: 1, allow: false });
    expect(entity.title).toBeUndefined();
  });

  it('SUPERUSER access + FieldRoles admin — user has admin role → kept (OR)', () => {
    const Cls = makeClass(AccessLevel.SUPERUSER, ['admin']);
    const entity = new Cls();
    removePrivateFields(entity, { id: 1, allow: false, roles: ['admin'] });
    expect(entity.title).toBe('secret');
  });

  it('SUPERUSER access + FieldRoles admin — superuser → kept (bypass)', () => {
    const Cls = makeClass(AccessLevel.SUPERUSER, ['admin']);
    const entity = new Cls();
    removePrivateFields(entity, { id: 1, allow: false }, { isSuperuser: true, roles: [] });
    expect(entity.title).toBe('secret');
  });

  it('SUPERUSER access + FieldRoles admin — user has wrong role → removed', () => {
    const Cls = makeClass(AccessLevel.SUPERUSER, ['admin']);
    const entity = new Cls();
    removePrivateFields(entity, { id: 1, allow: false, roles: ['editor'] });
    expect(entity.title).toBeUndefined();
  });

  it('Only FieldRoles (no FieldAccess) + user has role → kept', () => {
    const Cls = makeClass(undefined as any, ['admin']);
    const entity = new Cls();
    removePrivateFields(entity, { id: 1, allow: false, roles: ['admin'] });
    expect(entity.title).toBe('secret');
  });

  it('Only FieldRoles (no FieldAccess) + user has no role → removed', () => {
    const Cls = makeClass(undefined as any, ['admin']);
    const entity = new Cls();
    removePrivateFields(entity, { id: 1, allow: false, roles: ['editor'] });
    expect(entity.title).toBeUndefined();
  });
});

describe('stripWriteFields — FieldRoles OR with FieldAccess', () => {
  function makeClass(accessWrite: AccessLevel, rolesWrite?: string[]) {
    class Entity {
      data = 'value';
    }
    if (accessWrite !== undefined) {
      Reflect.defineMetadata('fieldAccess', { write: accessWrite }, Entity.prototype, 'data');
    }
    if (rolesWrite) {
      Reflect.defineMetadata('fieldRoles', { write: rolesWrite }, Entity.prototype, 'data');
    }
    return Entity;
  }

  it('SUPERUSER write + FieldRoles admin — user has admin → kept', () => {
    const Cls = makeClass(AccessLevel.SUPERUSER, ['admin']);
    const dto = new Cls();
    stripWriteFields(dto, Cls, { id: 1, allow: false }, { roles: ['admin'] });
    expect(dto.data).toBe('value');
  });

  it('SUPERUSER write + FieldRoles admin — user has no role → removed', () => {
    const Cls = makeClass(AccessLevel.SUPERUSER, ['admin']);
    const dto = new Cls();
    stripWriteFields(dto, Cls, { id: 1, allow: false }, { roles: ['editor'] });
    expect(dto.data).toBeUndefined();
  });

  it('Only FieldRoles write — user has role → kept', () => {
    const Cls = makeClass(undefined as any, ['admin']);
    const dto = new Cls();
    stripWriteFields(dto, Cls, { id: 1, allow: false }, { roles: ['admin'] });
    expect(dto.data).toBe('value');
  });

  it('Only FieldRoles write — user has no role → removed', () => {
    const Cls = makeClass(undefined as any, ['admin']);
    const dto = new Cls();
    stripWriteFields(dto, Cls, { id: 1, allow: false }, { roles: [] });
    expect(dto.data).toBeUndefined();
  });

  it('CLOSED write + FieldRoles admin — user has admin → kept (OR: roles bypass CLOSED)', () => {
    const Cls = makeClass(AccessLevel.CLOSED, ['admin']);
    const dto = new Cls();
    stripWriteFields(dto, Cls, { id: 1, allow: false }, { roles: ['admin'] });
    expect(dto.data).toBe('value');
  });

  it('FieldRoles with empty array — roles not restricted (empty array = no restriction)', () => {
    const Cls = makeClass(AccessLevel.SUPERUSER, []);
    const entity = new Cls();
    removePrivateFields(entity, { id: 1, allow: false, roles: ['admin'] });
    expect(entity.data).toBe('value');
  });
});
