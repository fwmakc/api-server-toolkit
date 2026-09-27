import { removePrivateFields, stripWriteFields } from '../common/service/private_fields.service';
import { PermissionRegistry } from '../common/permission.registry';
import { EntityAccessConfig } from '../common/access.rules';
import { BindDto } from '../common/dto/bind.dto';
import 'reflect-metadata';

class Enroll {
  student?: number;
  price?: number;
  internalNote?: string;
}

const config: EntityAccessConfig = {
  fields: {
    price: { response: [{ who: ['accountant'] }], request: [{ who: ['accountant'] }] },
    internalNote: { response: [{ who: ['moderator'] }] },
  },
};

const createBind = (props: Partial<BindDto>): BindDto => Object.assign(new BindDto(), props);

describe('private_fields.service (AccessRule model)', () => {
  beforeEach(() => {
    PermissionRegistry.clear();
    PermissionRegistry.set(Enroll, config);
  });

  describe('removePrivateFields (read)', () => {
    it('keeps field without rules', () => {
      const entity: any = new Enroll();
      entity.student = 5;
      removePrivateFields(entity, { roles: ['student'] });
      expect(entity.student).toBe(5);
    });

    it('keeps field when role matches', () => {
      const entity: any = Object.assign(new Enroll(), { price: 100 });
      removePrivateFields(entity, { roles: ['accountant'] });
      expect(entity.price).toBe(100);
    });

    it('strips field when role does not match', () => {
      const entity: any = Object.assign(new Enroll(), { price: 100 });
      removePrivateFields(entity, { roles: ['student'] });
      expect(entity.price).toBeUndefined();
    });

    it('strips field for anonymous without matching role', () => {
      const entity: any = Object.assign(new Enroll(), { price: 100 });
      removePrivateFields(entity, { roles: ['public'] });
      expect(entity.price).toBeUndefined();
    });

    it('bypasses with isSuperuser', () => {
      const entity: any = Object.assign(new Enroll(), { price: 100, internalNote: 'note' });
      removePrivateFields(entity, { roles: [], isSuperuser: true });
      expect(entity.price).toBe(100);
      expect(entity.internalNote).toBe('note');
    });

    it('does not bypass with bind allow — read visibility by roles only', () => {
      const entity: any = Object.assign(new Enroll(), { price: 100 });
      removePrivateFields(entity, createBind({ allow: true }));
      expect(entity.price).toBeUndefined();
    });

    it('strips in arrays', () => {
      const entities = [
        Object.assign(new Enroll(), { price: 1 }),
        Object.assign(new Enroll(), { price: 2 }),
      ];
      removePrivateFields(entities, { roles: ['student'] });
      expect(entities[0].price).toBeUndefined();
      expect(entities[1].price).toBeUndefined();
    });

    it('strips nested entity fields by nested config', () => {
      class Course {
        price?: number;
      }
      PermissionRegistry.set(Course, {
        fields: { price: { response: [{ who: ['accountant'] }] } },
      });

      const entity: any = Object.assign(new Enroll(), { course: Object.assign(new Course(), { price: 9 }) });
      removePrivateFields(entity, { roles: ['student'] });
      expect(entity.course.price).toBeUndefined();
    });

    it('keeps unruled field when account is undefined', () => {
      const entity: any = new Enroll();
      entity.student = 5;
      removePrivateFields(entity, undefined);
      expect(entity.student).toBe(5);
    });
  });

  describe('stripWriteFields (write)', () => {
    it('strips field when role does not match', () => {
      const dto: any = { price: 100 };
      stripWriteFields(dto, Enroll, createBind({}), { roles: ['student'] });
      expect(dto.price).toBeUndefined();
    });

    it('keeps field when role matches', () => {
      const dto: any = { price: 100 };
      stripWriteFields(dto, Enroll, createBind({}), { roles: ['accountant'] });
      expect(dto.price).toBe(100);
    });

    it('always strips owner relation field (server stamps it)', () => {
      const dto: any = { student: { id: 99 } };
      stripWriteFields(dto, Enroll, createBind({ name: 'student', id: 1 }), { roles: ['student'] });
      expect(dto.student).toBeUndefined();
    });

    it('strips only bindField without config rules', () => {
      const dto: any = { price: 1, student: { id: 99 } };
      stripWriteFields(dto, Enroll, createBind({ name: 'student' }), { roles: ['accountant'] });
      expect(dto.price).toBe(1);
      expect(dto.student).toBeUndefined();
    });

    it('bypasses for superuser', () => {
      const dto: any = { price: 100 };
      stripWriteFields(dto, Enroll, createBind({}), { roles: [], isSuperuser: true });
      expect(dto.price).toBe(100);
    });

    it('bypasses when bind.allow', () => {
      const dto: any = { price: 100 };
      stripWriteFields(dto, Enroll, createBind({ allow: true }), undefined);
      expect(dto.price).toBe(100);
    });

    it('handles string entityTarget (no config, only bindField strip)', () => {
      const dto: any = { student: { id: 99 }, title: 'x' };
      stripWriteFields(dto, 'enrolls', createBind({ name: 'student' }), { roles: ['student'] });
      expect(dto.student).toBeUndefined();
      expect(dto.title).toBe('x');
    });
  });
});
