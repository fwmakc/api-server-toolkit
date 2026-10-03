import { claimSlot } from '../common/service/capacity.helper';
import { Repository } from 'typeorm';

const makeRepo = (claimOk: boolean) => {
  const execute = jest.fn().mockResolvedValue({ raw: claimOk ? [{ id: 7 }] : [] });
  const where = jest.fn().mockReturnThis();
  const returning = jest.fn().mockReturnThis();
  const set = jest.fn().mockReturnThis();
  const update = jest.fn().mockReturnThis();
  const qb = { update, set, where, returning, execute };
  const createQueryBuilder = jest.fn(() => qb);

  const repository = {
    metadata: {
      findColumnWithPropertyPath: (prop: string) =>
        prop === 'capacity' || prop === 'taken' || prop === 'id'
          ? { databaseName: prop }
          : undefined,
    },
    createQueryBuilder,
  } as unknown as Repository<any>;

  return { repository, execute, where, set, returning, update, createQueryBuilder };
};

describe('capacity.helper / claimSlot', () => {
  it('claims the first candidate whose update hits a row', async () => {
    const { repository, where, set } = makeRepo(true);
    const id = await claimSlot(repository, [11, 12]);
    expect(id).toBe(7);
    expect(where).toHaveBeenCalledWith('"taken" < "capacity" AND "id" = :id', { id: 11 });
    expect(set).toHaveBeenCalledWith({ taken: expect.any(Function) });
    const raw = (set as jest.Mock).mock.calls[0][0].taken;
    expect(raw()).toBe('"taken" + 1');
  });

  it('moves to the next candidate when the first is full', async () => {
    const { repository, execute } = makeRepo(false);
    // first call — full (empty raw), second — claimed
    execute
      .mockResolvedValueOnce({ raw: [] })
      .mockResolvedValueOnce({ raw: [{ id: 12 }] });

    const id = await claimSlot(repository, [11, 12]);
    expect(id).toBe(12);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('returns null when every candidate is full', async () => {
    const { repository, execute } = makeRepo(false);
    expect(await claimSlot(repository, [11, 12])).toBeNull();
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('returns null for an empty candidate list without querying', async () => {
    const { repository, createQueryBuilder } = makeRepo(true);
    expect(await claimSlot(repository, [])).toBeNull();
    expect(createQueryBuilder).not.toHaveBeenCalled();
  });

  it('honors custom column names resolved through entity metadata', async () => {
    const { repository, where, set } = makeRepo(true);
    await claimSlot(repository, [3], { capacityColumn: 'limit', takenColumn: 'occupied' });
    expect(where).toHaveBeenCalledWith('"occupied" < "limit" AND "id" = :id', { id: 3 });
    const raw = (set as jest.Mock).mock.calls[0][0].occupied;
    expect(raw()).toBe('"occupied" + 1');
  });
});
