import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import {
  accessBind,
  compileRuleToBind,
  matchRoles,
  matchRule,
} from '../common/access.rules';
import { buildFindWhere } from '../common/service/find.helper';
import { prepareAndUpdate } from '../common/service/write.helper';
import { removePrivateFields, stripWriteFields } from '../common/service/private_fields.service';
import { findUniqueEntry } from '../common/service/unique.helper';
import { BindDto } from '../common/dto/bind.dto';
import { FindDto } from '../common/dto/find.dto';

jest.mock('../common/service/search.service', () => ({
  buildSearchWhere: jest.fn(),
  mergeSearchWhere: jest.fn(() => [{ title: 'a' }, { title: 'b' }]),
}));
jest.mock('../common/service/sanitize.service', () => ({ sanitizeForSave: jest.fn() }));
jest.mock('../common/service/bind-resolve.helper', () => ({
  resolveAutoAssign: jest.fn().mockResolvedValue({ name: 'author', id: 77 }),
}));

const createBind = (props: Partial<BindDto>): BindDto =>
  Object.assign(new BindDto(), props);
const createFind = (props: Partial<FindDto>): FindDto =>
  Object.assign(new FindDto(), props);

// Wave 6 audit regressions: every fixed finding is pinned here.
describe('Wave 6 audit regressions', () => {
  describe('empty rule arrays deny (used to allow everyone)', () => {
    it('matchRoles([]) is false, undefined is true', () => {
      expect(matchRoles([], ['authenticated'])).toBe(false);
      expect(matchRoles(undefined, ['authenticated'])).toBe(true);
      expect(matchRoles([{ who: ['authenticated'] }], ['authenticated'])).toBe(true);
    });

    it('accessBind([]) throws instead of returning an allow-all bind', () => {
      expect(() => accessBind([], { id: 1 } as any)).toThrow(ForbiddenException);
    });

    it('AccessGuard-side: empty rules never compile to undefined bind via matchRule', () => {
      expect(matchRule([], { id: 1 } as any)).toBeUndefined();
      expect(compileRuleToBind(undefined, { id: 1 } as any)).toBeUndefined();
    });
  });

  describe('tenant scope "id" is rejected (used to compile to no scoping)', () => {
    it('compileRuleToBind throws for scope { tenant: "id" }', () => {
      const matched = {
        rule: { who: ['authenticated'], scope: { tenant: 'id' } },
        roles: ['authenticated'],
        scope: { tenant: 'id' } as any,
      };
      expect(() =>
        compileRuleToBind(matched as any, { id: 1, tenantId: 5 } as any),
      ).toThrow(/relation/);
    });
  });

  describe('bind.filter survives array wheres from multi-branch search', () => {
    it('filter merges into each OR-branch instead of spreading the array', () => {
      const bind = createBind({ allow: true, filter: { isPublished: true } });
      const find = createFind({ search: { value: 'x' } } as any);
      const { where } = buildFindWhere(bind, find);
      expect(Array.isArray(where)).toBe(true);
      expect(where).toEqual([
        { title: 'a', isPublished: true },
        { title: 'b', isPublished: true },
      ]);
    });
  });

  describe('update re-stamps owner/tenant like create', () => {
    it('prepareAndUpdate overwrites client-supplied owner and tenant links', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const manager: any = {
        getRepository: jest.fn().mockReturnValue({
          metadata: { relations: [], columns: [], target: {} },
          save,
        }),
      };
      const bind = createBind({
        id: 77,
        name: 'author',
        key: 'id',
        tenantId: 9,
        tenantName: 'tenant',
      });
      const entity: any = { id: 1, author: { id: 999 }, tenant: { id: 666 } };
      await prepareAndUpdate(entity, {}, bind, manager);

      // stamped from the bind, not from the client payload
      expect(entity.author).toEqual({ id: 77 });
      expect(entity.tenant).toEqual({ id: 9 });
    });
  });

  describe('stripWriteFields removes the tenant link (owner link was already covered)', () => {
    it('deletes bind.tenantName from the payload', () => {
      const dto: any = { title: 'x', tenant: { id: 666 }, author: { id: 1 } };
      stripWriteFields(dto, function Entity() {}, createBind({ tenantId: 9, tenantName: 'tenant' }));
      expect(dto.tenant).toBeUndefined();
      expect(dto.title).toBe('x');
    });
  });

  describe('field rules: explicit empty array strips for everyone', () => {
    it('removePrivateFields strips a field whose response is []', () => {
      class Secret {
        name: string;
        secretNotes: string;
      }
      const { PermissionRegistry } = require('../common/permission.registry');
      PermissionRegistry.set(Secret as any, {
        fields: { secretNotes: { response: [] } },
      } as any);
      const out: any = removePrivateFields(
        Object.assign(new Secret(), { name: 'a', secretNotes: 'x' }),
        { roles: ['authenticated'] },
      );
      expect(out.secretNotes).toBeUndefined();
      expect(out.name).toBe('a');
    });
  });

  describe('unique probe respects bind scope and soft deletes', () => {
    it('findUniqueEntry adds tenant condition and live-only filter', async () => {
      const captured: any[] = [];
      const repository: any = {
        metadata: {
          indices: [{ isUnique: true, columns: [{ propertyName: 'slug' }] }],
        },
        findOne: jest.fn((opts: any) => {
          captured.push(opts.where);
          return null;
        }),
      };
      await findUniqueEntry(
        repository,
        { slug: 'x' },
        createBind({ tenantId: 9, tenantName: 'tenant' }),
        'deleted_at',
      );
      expect(captured[0].slug).toBe('x');
      expect(captured[0].tenant).toEqual({ id: 9 });
      expect(captured[0].deleted_at).toEqual(IsNull());
    });
  });
});
