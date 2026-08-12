import { getTenantStrategy } from '../common/service/tenant-strategy';

describe('getTenantStrategy', () => {
  let original: string | undefined;

  beforeEach(() => {
    original = process.env.TENANT_STRATEGY;
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.TENANT_STRATEGY;
    } else {
      process.env.TENANT_STRATEGY = original;
    }
  });

  it("returns 'where' by default (no env)", () => {
    delete process.env.TENANT_STRATEGY;
    expect(getTenantStrategy()).toBe('where');
  });

  it("returns 'schema' when TENANT_STRATEGY=schema", () => {
    process.env.TENANT_STRATEGY = 'schema';
    expect(getTenantStrategy()).toBe('schema');
  });

  it("returns 'database' when TENANT_STRATEGY=database", () => {
    process.env.TENANT_STRATEGY = 'database';
    expect(getTenantStrategy()).toBe('database');
  });

  it("returns 'where' for unknown value", () => {
    process.env.TENANT_STRATEGY = 'invalid';
    expect(getTenantStrategy()).toBe('where');
  });
});
