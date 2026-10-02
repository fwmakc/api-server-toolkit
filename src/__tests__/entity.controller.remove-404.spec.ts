import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { BaseEntity } from 'typeorm';
import { EntityController } from '../common/entity.controller';
import { CommonDto } from '../common/common.dto';

// Regression (stage-3 e2e): delete/restore handlers returned 200 with body
// `false` when nothing matched the bind scope — an out-of-scope delete must
// answer 404 like update does, not a silent false success.
class TestDto extends CommonDto {}
class TestEntity extends BaseEntity {}

class Controller extends EntityController({
  name: 'Спека',
  dto: TestDto,
  entity: TestEntity,
  operations: { delete: [{ who: ['admin'] }] },
})<TestDto, TestEntity, any> {
  constructor(readonly service: any) {
    super();
  }
}

const admin = { id: 1, username: 'a@test.local', roles: ['admin'] };

describe('EntityController remove/hardDelete/restore — 404 on nothing deleted', () => {
  it('remove throws NotFoundException when service.remove returns false', async () => {
    const ctl = new Controller({ remove: jest.fn().mockResolvedValue(false) });
    await expect(ctl.remove('5', admin as any)).rejects.toThrow(NotFoundException);
  });

  it('remove returns true when a row was actually deleted', async () => {
    const ctl = new Controller({ remove: jest.fn().mockResolvedValue(true) });
    await expect(ctl.remove('5', admin as any)).resolves.toBe(true);
  });

  it('hardDelete throws NotFoundException when nothing was deleted', async () => {
    const ctl = new Controller({ hardDelete: jest.fn().mockResolvedValue(false) });
    await expect(ctl.hardDelete('5', admin as any)).rejects.toThrow(NotFoundException);
  });

  it('restore throws NotFoundException when nothing was restored', async () => {
    const ctl = new Controller({ restore: jest.fn().mockResolvedValue(false) });
    await expect(ctl.restore('5', admin as any)).rejects.toThrow(NotFoundException);
  });
});
