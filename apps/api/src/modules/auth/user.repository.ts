import bcrypt from 'bcryptjs'
import { Context, Effect, Layer, Schema } from 'effect'
import { SqlClient, SqlModel, SqlSchema } from 'effect/unstable/sql'
import type { SeedUser } from '../../config.js'
import { SqlLive } from '../../lib/db.js'
import { BackupCodeUsed, UserNotFound } from './errors.js'
import { User, type UserId } from './schema.js'

const userFields = (user: typeof User.Type) => ({
  id: user.id,
  username: user.username,
  passwordHash: user.passwordHash,
  totpSecret: user.totpSecret,
  totpEnabled: user.totpEnabled,
  backupCodes: user.backupCodes,
  backupCodesUsed: user.backupCodesUsed
})

export class UserRepository extends Context.Service<UserRepository, {
  findByUsername(username: string): Effect.Effect<typeof User.Type, UserNotFound>
  findById(id: UserId): Effect.Effect<typeof User.Type, UserNotFound>
  verifyPassword(password: string, hash: string): Effect.Effect<boolean>
  hashPassword(password: string): Effect.Effect<string>
  create(input: {
    username: string
    passwordHash: string
    totpSecret?: string | null
    totpEnabled?: boolean
    backupCodes?: ReadonlyArray<string>
    backupCodesUsed?: ReadonlyArray<boolean>
  }): Effect.Effect<typeof User.Type>
  setupTotp(
    userId: UserId,
    totpSecret: string,
    backupCodes: ReadonlyArray<string>
  ): Effect.Effect<typeof User.Type, UserNotFound>
  enableTotp(userId: UserId): Effect.Effect<typeof User.Type, UserNotFound>
  updateTotp(
    userId: UserId,
    totpSecret: string,
    backupCodes: ReadonlyArray<string>
  ): Effect.Effect<typeof User.Type, UserNotFound>
  markBackupCodeUsed(
    userId: UserId,
    index: number
  ): Effect.Effect<typeof User.Type, UserNotFound | BackupCodeUsed>
  seed(users: ReadonlyArray<SeedUser>): Effect.Effect<void>
}>()('auth/UserRepository') {
  static readonly layer = Layer.effect(
    UserRepository,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      const repo = yield* SqlModel.makeRepository(User, {
        tableName: 'users',
        idColumn: 'id',
        spanPrefix: 'Users'
      })

      const findByUsername = Effect.fn('UserRepository.findByUsername')(
        (username: string) =>
          SqlSchema.findOne({
            Request: Schema.String,
            Result: User,
            execute: (name) => sql`SELECT * FROM users WHERE username = ${name}`
          })(username).pipe(
            Effect.catchTags({
              NoSuchElementError: () => new UserNotFound(),
              SchemaError: Effect.die,
              SqlError: Effect.die
            })
          )
      )

      const findById = Effect.fn('UserRepository.findById')((id: UserId) =>
        repo.findById(id).pipe(
          Effect.catchTags({
            NoSuchElementError: () => new UserNotFound(),
            SchemaError: Effect.die,
            SqlError: Effect.die
          })
        )
      )

      const verifyPassword = (password: string, hash: string) =>
        Effect.promise(() => bcrypt.compare(password, hash))

      const hashPassword = (password: string) =>
        Effect.promise(() => bcrypt.hash(password, 12))

      const create = Effect.fn('UserRepository.create')(
        (input: {
          username: string
          passwordHash: string
          totpSecret?: string | null
          totpEnabled?: boolean
          backupCodes?: ReadonlyArray<string>
          backupCodesUsed?: ReadonlyArray<boolean>
        }) =>
          User.insert
            .makeEffect({
              username: input.username,
              passwordHash: input.passwordHash,
              totpSecret: input.totpSecret ?? null,
              totpEnabled: input.totpEnabled ?? false,
              backupCodes: input.backupCodes ?? [],
              backupCodesUsed: input.backupCodesUsed ?? []
            })
            .pipe(Effect.flatMap(repo.insert), Effect.orDie)
      )

      const setupTotp = Effect.fn('UserRepository.setupTotp')(
        (userId: UserId, totpSecret: string, backupCodes: ReadonlyArray<string>) =>
          findById(userId).pipe(
            Effect.flatMap((user) =>
              User.update
                .makeEffect({
                  ...userFields(user),
                  totpSecret,
                  totpEnabled: false,
                  backupCodes,
                  backupCodesUsed: new Array(backupCodes.length).fill(false)
                })
                .pipe(Effect.flatMap(repo.update), Effect.orDie)
            )
          )
      )

      const enableTotp = Effect.fn('UserRepository.enableTotp')((userId: UserId) =>
        findById(userId).pipe(
          Effect.flatMap((user) =>
            User.update
              .makeEffect({
                ...userFields(user),
                totpEnabled: true
              })
              .pipe(Effect.flatMap(repo.update), Effect.orDie)
          )
        )
      )

      const updateTotp = Effect.fn(
        'UserRepository.updateTotp'
      )((userId: UserId, totpSecret: string, backupCodes: ReadonlyArray<string>) =>
        findById(userId).pipe(
          Effect.flatMap((user) =>
            User.update
              .makeEffect({
                ...userFields(user),
                totpSecret,
                totpEnabled: true,
                backupCodes,
                backupCodesUsed: new Array(backupCodes.length).fill(false)
              })
              .pipe(Effect.flatMap(repo.update), Effect.orDie)
          )
        )
      )

      const markBackupCodeUsed = Effect.fn('UserRepository.markBackupCodeUsed')(
        (userId: UserId, index: number) =>
          findById(userId).pipe(
            Effect.flatMap((user) => {
              const used = [...user.backupCodesUsed]
              if (index < 0 || index >= used.length) {
                return new BackupCodeUsed()
              }
              if (used[index]) {
                return new BackupCodeUsed()
              }
              used[index] = true
              return User.update
                .makeEffect({
                  ...userFields(user),
                  backupCodesUsed: used
                })
                .pipe(Effect.flatMap(repo.update), Effect.orDie)
            })
          )
      )

      const seed = Effect.fn('UserRepository.seed')(
        (users: ReadonlyArray<SeedUser>) =>
          Effect.forEach(
            users,
            (seedUser) =>
              findByUsername(seedUser.username).pipe(
                Effect.catchTag('UserNotFound', () =>
                  hashPassword(seedUser.password).pipe(
                    Effect.flatMap((passwordHash) =>
                      create({ username: seedUser.username, passwordHash })
                    )
                  )
                ),
                Effect.ignore
              ),
            { discard: true }
          )
      )

      return UserRepository.of({
        findByUsername,
        findById,
        verifyPassword,
        hashPassword,
        create,
        setupTotp,
        enableTotp,
        updateTotp,
        markBackupCodeUsed,
        seed
      })
    })
  ).pipe(Layer.provide(SqlLive))
}
