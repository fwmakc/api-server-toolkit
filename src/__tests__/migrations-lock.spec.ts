import { DataSourceOptions } from "typeorm";
import {
  MIGRATION_LOCK_KEY,
  runMigrationsUnderLock,
} from "../common/db/migrations-lock";

jest.mock("typeorm", () => {
  const state: {
    lastOptions?: DataSourceOptions;
    runner?: {
      queries: { sql: string; params?: unknown[] }[];
      connect: jest.Mock;
      startTransaction: jest.Mock;
      rollbackTransaction: jest.Mock;
      release: jest.Mock;
      query: jest.Mock;
    };
    runMigrations: jest.Mock;
    destroyed: number;
  } = { destroyed: 0, runMigrations: jest.fn() };
  class FakeRunner {
    queries: { sql: string; params?: unknown[] }[] = [];
    connect = jest.fn();
    startTransaction = jest.fn();
    rollbackTransaction = jest.fn().mockResolvedValue(undefined);
    release = jest.fn();
    query = jest.fn((sql: string, params?: unknown[]) => {
      this.queries.push({ sql, params });
      return Promise.resolve([]);
    });
  }
  class FakeDataSource {
    isDestroyed = false;
    constructor(options: DataSourceOptions) {
      state.lastOptions = options;
    }
    get options() {
      return state.lastOptions;
    }
    initialize = jest.fn().mockResolvedValue(this);
    destroy = jest.fn(async () => {
      this.isDestroyed = true;
      state.destroyed += 1;
    });
    createQueryRunner = jest.fn(() => (state.runner ??= new FakeRunner()));
    runMigrations = state.runMigrations;
  }
  return { DataSource: FakeDataSource, __state: state };
});

const { __state } = jest.requireMock("typeorm") as {
  __state: {
    lastOptions?: DataSourceOptions;
    runner?: { queries: { sql: string; params?: unknown[] }[] };
    runMigrations: jest.Mock;
    destroyed: number;
  };
};

const baseOption = {
  type: "postgres",
  host: "db",
  database: "test",
  migrationsRun: true,
} as DataSourceOptions;

describe("runMigrationsUnderLock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (__state.runner) __state.runner.queries.length = 0;
    __state.destroyed = 0;
  });

  it("takes a transaction-scoped advisory lock around migrations", async () => {
    __state.runMigrations.mockResolvedValueOnce(["Init1700000000000"]);
    const executed = await runMigrationsUnderLock(baseOption);
    expect(executed).toEqual(["Init1700000000000"]);
    expect(__state.runner!.queries).toEqual([
      { sql: "SELECT pg_advisory_xact_lock($1)", params: [MIGRATION_LOCK_KEY] },
    ]);
  });

  it("strips migrationsRun so the caller's DataSource does not re-run them", async () => {
    await runMigrationsUnderLock(baseOption);
    expect(__state.lastOptions).toMatchObject({ migrationsRun: false });
  });

  it("rolls back and destroys the throwaway DataSource when migrations fail", async () => {
    __state.runMigrations.mockRejectedValueOnce(new Error("bad migration"));
    await expect(runMigrationsUnderLock(baseOption)).rejects.toThrow(
      "bad migration",
    );
    expect(__state.destroyed).toBe(1);
  });

  it("runs migrations without a lock for non-postgres drivers", async () => {
    const option = {
      type: "sqlite",
      database: ":memory:",
      migrationsRun: true,
    } as unknown as DataSourceOptions;
    await runMigrationsUnderLock(option);
    expect(__state.runner!.queries).toEqual([]);
  });
});
