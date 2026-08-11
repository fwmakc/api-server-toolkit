import 'reflect-metadata';
import { prepareAndCreate, prepareAndUpdate } from '../common/service/write.helper';
import { BindDto } from '../common/dto/bind.dto';
import { EntityManager } from 'typeorm';

jest.mock('../common/service/sanitize.service', () => ({
  sanitizeForSave: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../common/service/bind-resolve.helper', () => ({
  resolveAutoAssign: jest.fn().mockResolvedValue(null),
}));

import { sanitizeForSave } from '../common/service/sanitize.service';
import { resolveAutoAssign } from '../common/service/bind-resolve.helper';

const createBind = (props: Partial<BindDto>): BindDto => Object.assign(new BindDto(), props);

const createMockManager = (saveResult?: any) => {
  const repo = {
    metadata: { columns: [], relations: [], indices: [] },
    save: jest.fn().mockResolvedValue(saveResult ?? { id: 1, name: 'test' }),
  };
  return {
    getRepository: jest.fn().mockReturnValue(repo),
  } as unknown as EntityManager;
};

describe('write.helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('prepareAndCreate', () => {
    it('sanitizes and saves entity', async () => {
      const manager = createMockManager();
      const bind = createBind({});
      const entity: any = { name: 'test' };
      const result = await prepareAndCreate(entity, 'EntityTarget', bind, manager);
      expect(sanitizeForSave).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('calls resolveAutoAssign when bind.id is set and !allow', async () => {
      const manager = createMockManager();
      const bind = createBind({ id: 5 });
      const entity: any = { name: 'test' };
      await prepareAndCreate(entity, 'EntityTarget', bind, manager);
      expect(resolveAutoAssign).toHaveBeenCalled();
    });

    it('skips resolveAutoAssign when bind.allow is true', async () => {
      const manager = createMockManager();
      const bind = createBind({ id: 5, allow: true });
      const entity: any = { name: 'test' };
      await prepareAndCreate(entity, 'EntityTarget', bind, manager);
      expect(resolveAutoAssign).not.toHaveBeenCalled();
    });

    it('skips resolveAutoAssign when bind.id is undefined', async () => {
      const manager = createMockManager();
      const bind = createBind({});
      const entity: any = { name: 'test' };
      await prepareAndCreate(entity, 'EntityTarget', bind, manager);
      expect(resolveAutoAssign).not.toHaveBeenCalled();
    });

    it('sets auto-assign field on entity when resolved', async () => {
      (resolveAutoAssign as jest.Mock).mockResolvedValue({ name: 'user', id: 10 });
      const manager = createMockManager();
      const bind = createBind({ id: 5 });
      const entity: any = { name: 'test' };
      await prepareAndCreate(entity, 'EntityTarget', bind, manager);
      expect(entity.user).toEqual({ id: 10 });
    });

    it('sets tenant relation on entity when tenantId and tenantName provided', async () => {
      const manager = createMockManager();
      const bind = createBind({ tenantId: 1, tenantName: 'tenant' });
      const entity: any = { name: 'test' };
      await prepareAndCreate(entity, 'EntityTarget', bind, manager);
      expect(entity.tenant).toEqual({ id: 1 });
    });

    it('skips tenant when bind.allow is true', async () => {
      const manager = createMockManager();
      const bind = createBind({ tenantId: 1, tenantName: 'tenant', allow: true });
      const entity: any = { name: 'test' };
      await prepareAndCreate(entity, 'EntityTarget', bind, manager);
      expect(entity.tenant).toBeUndefined();
    });

    it('skips tenant when tenantName contains dot', async () => {
      const manager = createMockManager();
      const bind = createBind({ tenantId: 1, tenantName: 'org.tenant' });
      const entity: any = { name: 'test' };
      await prepareAndCreate(entity, 'EntityTarget', bind, manager);
      expect(entity['org.tenant']).toBeUndefined();
    });
  });

  describe('prepareAndUpdate', () => {
    it('sanitizes and saves entity', async () => {
      const manager = createMockManager({ id: 1, name: 'updated' });
      const bind = createBind({});
      const entity: any = { id: 1, name: 'updated' };
      await prepareAndUpdate(entity, 'EntityTarget', bind, manager);
      expect(sanitizeForSave).toHaveBeenCalled();
      const repo = (manager as any).getRepository('EntityTarget');
      expect(repo.save).toHaveBeenCalledWith(entity);
    });
  });
});
