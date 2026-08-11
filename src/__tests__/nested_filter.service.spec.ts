import 'reflect-metadata';
import { filterNestedRelations } from '../common/service/nested_filter.service';
import { BindDto } from '../common/dto/bind.dto';
import { PermissionRegistry } from '../common/permission.registry';

class UserEntity { account = { id: 1 }; }
class PostEntity { user = { account: { id: 1 } }; title = 'test'; }

describe('nested_filter.service', () => {
  beforeEach(() => {
    PermissionRegistry.clear();
  });

  const createBind = (props: Partial<BindDto>): BindDto => Object.assign(new BindDto(), props);

  it('does nothing for empty result', () => {
    const result: any[] = [];
    filterNestedRelations(result, createBind({ id: 1, name: 'account' }));
    expect(result).toEqual([]);
  });

  it('does nothing for non-array result', () => {
    const result = null as any;
    filterNestedRelations(result, createBind({ id: 1, name: 'account' }));
    expect(result).toBeNull();
  });

  it('does nothing when bind is undefined', () => {
    const result: any[] = [{ id: 1 }];
    filterNestedRelations(result, undefined);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('does nothing when bind.allow is true', () => {
    const result: any[] = [{ id: 1 }];
    filterNestedRelations(result, createBind({ id: 1, allow: true }));
    expect(result).toEqual([{ id: 1 }]);
  });

  it('does nothing when bind.id is undefined', () => {
    const result: any[] = [{ id: 1 }];
    filterNestedRelations(result, createBind({ name: 'account' }));
    expect(result).toEqual([{ id: 1 }]);
  });

  it('filters nested array relations by ownership', () => {
    PermissionRegistry.set(UserEntity, { accountTable: 'account', accountField: 'id', create: 'PUBLIC' } as any);

    const ownedUser = new UserEntity();
    ownedUser.account = { id: 42 };

    const otherUser = new UserEntity();
    otherUser.account = { id: 99 };

    const result: any[] = [{ users: [ownedUser, otherUser] }];
    filterNestedRelations(result, createBind({ id: 42, name: 'account', key: 'id' }));

    expect(result[0].users).toHaveLength(1);
    expect(result[0].users[0].account.id).toBe(42);
  });

  it('filters nested single relation by ownership', () => {
    PermissionRegistry.set(UserEntity, { accountTable: 'account', accountField: 'id', create: 'PUBLIC' } as any);

    const ownedUser = new UserEntity();
    ownedUser.account = { id: 42 };

    const result: any[] = [{ user: ownedUser }];
    filterNestedRelations(result, createBind({ id: 42, name: 'account', key: 'id' }));

    expect(result[0].user).toBe(ownedUser);
  });

  it('deletes nested single relation when not owned', () => {
    PermissionRegistry.set(UserEntity, { accountTable: 'account', accountField: 'id', create: 'PUBLIC' } as any);

    const otherUser = new UserEntity();
    otherUser.account = { id: 99 };

    const result: any[] = [{ user: otherUser }];
    filterNestedRelations(result, createBind({ id: 42, name: 'account', key: 'id' }));

    expect(result[0].user).toBeUndefined();
  });

  it('handles nested account path with dot notation', () => {
    PermissionRegistry.set(PostEntity, { accountTable: 'user.account', accountField: 'id', create: 'PUBLIC' } as any);

    const ownedPost = new PostEntity();
    ownedPost.user = { account: { id: 42 } };

    const otherPost = new PostEntity();
    otherPost.user = { account: { id: 99 } };

    const result: any[] = [{ posts: [ownedPost, otherPost] }];
    filterNestedRelations(result, createBind({ id: 42, name: 'account', key: 'id' }));

    expect(result[0].posts).toHaveLength(1);
    expect(result[0].posts[0].user.account.id).toBe(42);
  });

  it('skips entities without accountTable config', () => {
    const result: any[] = [{ items: [{ id: 1 }, { id: 2 }] }];
    filterNestedRelations(result, createBind({ id: 1, name: 'account' }));
    expect(result[0].items).toHaveLength(2);
  });

  it('skips plain objects (constructor === Object)', () => {
    const result: any[] = [{ data: { nested: true } }];
    filterNestedRelations(result, createBind({ id: 1, name: 'account' }));
    expect(result[0].data).toEqual({ nested: true });
  });

  it('handles empty relation arrays', () => {
    PermissionRegistry.set(UserEntity, { accountTable: 'account', accountField: 'id', create: 'PUBLIC' } as any);

    const result: any[] = [{ users: [] }];
    filterNestedRelations(result, createBind({ id: 42, name: 'account', key: 'id' }));
    expect(result[0].users).toEqual([]);
  });

  it('handles multiple results', () => {
    PermissionRegistry.set(UserEntity, { accountTable: 'account', accountField: 'id', create: 'PUBLIC' } as any);

    const owned1 = new UserEntity();
    owned1.account = { id: 42 };
    const owned2 = new UserEntity();
    owned2.account = { id: 42 };
    const other = new UserEntity();
    other.account = { id: 99 };

    const result: any[] = [{ users: [owned1, other] }, { users: [owned2] }];
    filterNestedRelations(result, createBind({ id: 42, name: 'account', key: 'id' }));

    expect(result[0].users).toHaveLength(1);
    expect(result[1].users).toHaveLength(1);
  });
});
