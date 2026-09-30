import { DataSource, DataSourceOptions, Migration } from "typeorm";

/**
 * Advisory-lock key for boot migrations. Arbitrary constant — the lock is
 * per-database, so services on separate databases never contend; only
 * concurrent replicas of the same service do.
 */
export const MIGRATION_LOCK_KEY = 827261001;

/**
 * Run pending migrations under a PostgreSQL transaction-local advisory lock
 * (pg_advisory_xact_lock) so simultaneously booting replicas serialize:
 * the first replica applies pending migrations while the others wait and
 * then see zero pending migrations. TypeORM 0.3.x has no built-in migration
 * locking, and plain `migrationsRun: true` races on a cold database.
 *
 * The lock is held inside an explicit transaction because services usually
 * sit behind pgbouncer in transaction-pooling mode — a session-level
 * pg_advisory_lock could be released from a different backend connection.
 * The open transaction pins one backend for the whole runMigrations() call
 * (migrations use their own runners, which are covered by the held lock).
 *
 * Non-PostgreSQL drivers have no advisory locks — migrations run unlocked.
 *
 * Returns the list of executed migrations. Destroys the throwaway
 * DataSource in every code path; callers should then boot their real
 * DataSource with `migrationsRun` stripped (it is already applied here).
 */
export const runMigrationsUnderLock = async (
  option: DataSourceOptions,
  lockKey: number = MIGRATION_LOCK_KEY,
): Promise<Migration[]> => {
  const dataSource = new DataSource({ ...option, migrationsRun: false });
  await dataSource.initialize();
  try {
    if (dataSource.options.type !== "postgres") {
      return dataSource.runMigrations();
    }
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    await runner.query("SELECT pg_advisory_xact_lock($1)", [lockKey]);
    try {
      return await dataSource.runMigrations();
    } finally {
      // Ends the transaction (and with it the xact lock) even when a
      // migration fails — already-applied migrations stay committed.
      await runner.rollbackTransaction().catch(() => undefined);
      await runner.release();
    }
  } finally {
    await dataSource.destroy();
  }
};
