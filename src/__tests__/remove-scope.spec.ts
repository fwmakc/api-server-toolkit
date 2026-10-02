import 'reflect-metadata';
import { CommonService } from '../common/common.service';

// Minimal concrete service: CommonService is generic-only, remove() must
// shape the atomic scope criteria without dot-path keys (TypeORM update/
// delete criteria cannot express multi-hop relation paths).
class TestService extends CommonService<any, any> {}

// getSoftDeleteColumn does Reflect.getMetadata on the target — a class
// object (no soft-delete metadata → hardRemove path), never a primitive
class TargetEntity {}

const makeRepo = (affected = 1) => ({
  update: jest.fn().mockResolvedValue({ affected }),
  delete: jest.fn().mockResolvedValue({ affected }),
  // existsInScope → findOne lands here (row in scope)
  find: jest.fn().mockResolvedValue([{ id: 5 }]),
  metadata: { target: TargetEntity },
});

const makeService = (repo: any) => {
  const service = Object.create(TestService.prototype) as any;
  service.repository = repo;
  // the existsInScope pre-check runs its own find pipeline — not the
  // subject here; the test targets bindCriteria shaping in the statement
  service.existsInScope = jest.fn().mockResolvedValue(true);
  return service;
};

describe('CommonService.remove — atomic scope criteria', () => {
  it('single-hop bind name goes into the write statement (race closure)', async () => {
    const repo = makeRepo();
    const service = makeService(repo);

    await service.remove(5, {
      allow: false,
      id: 7,
      name: 'account',
      key: 'id',
    });

    expect(repo.delete).toHaveBeenCalledWith({
      account: { id: 7 },
      id: 5,
    });
  });

  it('multi-hop (dot-path) bind stays out of the criteria — existsInScope guards it', async () => {
    const repo = makeRepo();
    const service = makeService(repo);

    await service.remove(5, {
      allow: false,
      id: 7,
      name: 'article.account',
      key: 'id',
    });

    const criteria = repo.delete.mock.calls[0][0];
    expect(Object.keys(criteria)).toEqual(['id']);
    expect(criteria.id).toBe(5);
  });

  it('allow bind produces an empty scope', async () => {
    const repo = makeRepo();
    const service = makeService(repo);

    await service.remove(5, { allow: true });

    expect(repo.delete).toHaveBeenCalledWith({ id: 5 });
  });
});
