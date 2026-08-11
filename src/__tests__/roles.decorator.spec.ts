import 'reflect-metadata';
import { Roles } from '../common/decorator/roles.decorator';
import { ROLES_METADATA } from '../common/guard/roles.guard';

describe('Roles decorator', () => {
  it('sets metadata with single role', () => {
    class TestCtrl {
      @Roles('admin')
      handler() {}
    }
    const meta = Reflect.getMetadata(ROLES_METADATA, TestCtrl.prototype.handler);
    expect(meta).toEqual(['admin']);
  });

  it('sets metadata with multiple roles', () => {
    class TestCtrl2 {
      @Roles('admin', 'editor')
      handler() {}
    }
    const meta = Reflect.getMetadata(ROLES_METADATA, TestCtrl2.prototype.handler);
    expect(meta).toEqual(['admin', 'editor']);
  });

  it('sets metadata with empty call', () => {
    class TestCtrl3 {
      @Roles()
      handler() {}
    }
    const meta = Reflect.getMetadata(ROLES_METADATA, TestCtrl3.prototype.handler);
    expect(meta).toEqual([]);
  });

  it('metadata key matches ROLES_METADATA constant', () => {
    expect(ROLES_METADATA).toBe('roles');
  });

  it('Roles is a function (decorator factory)', () => {
    expect(typeof Roles).toBe('function');
  });
});
