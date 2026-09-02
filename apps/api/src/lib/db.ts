import { SqliteClient, SqliteMigrator } from '@effect/sql-sqlite-node'
import { Effect, Layer } from 'effect'
import { SqlClient } from 'effect/unstable/sql'
import { AUTH_DB_FILE } from '../config.js'

const SqlLayer = SqliteClient.layer({
  filename: AUTH_DB_FILE,
})

const MigratorLayer = SqliteMigrator.layer({
  loader: SqliteMigrator.fromRecord({
    '0001_create_users': Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      yield* sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          passwordHash TEXT NOT NULL,
          totpSecret TEXT,
          totpEnabled INTEGER NOT NULL DEFAULT 0,
          backupCodes TEXT NOT NULL DEFAULT '[]',
          backupCodesUsed TEXT NOT NULL DEFAULT '[]',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `
    }),
    '0002_add_user_role': Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      yield* sql`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`
    }),
  }),
})

export const SqlLive = MigratorLayer.pipe(Layer.provideMerge(SqlLayer))
