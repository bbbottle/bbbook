import { randomBytes } from 'node:crypto'
import { unlink, writeFile } from 'node:fs/promises'
import { Context, Effect, Layer, Option, Schema } from 'effect'
import bcrypt from 'bcryptjs'
import { SqlClient, SqlModel, SqlSchema } from 'effect/unstable/sql'
import {
  AUTH_DEFAULT_ADMIN_PASSWORD,
  AUTH_SEED_USERS,
  STORAGE_PATH,
} from '../../config.js'
import { SqlLive } from '../../lib/db.js'
import { logger } from '../../lib/logger.js'
import { decryptSecret, encryptSecret } from '../../lib/totp-crypto.js'
import { UserStoreError } from '../../shared/schema/errors.js'
import { TotpAlreadyEnabledError, UserNotFoundError, UsernameTakenError } from './errors.js'
import { User, UserId, UserPublic } from './schema.js'

export class UserRepository extends Context.Service<
  UserRepository,
  {
    findByUsername(username: string): Effect.Effect<Option.Option<User>, UserStoreError>
    findById(userId: string): Effect.Effect<Option.Option<User>, UserStoreError>
    verifyPassword(user: User, password: string): Effect.Effect<boolean, never>
    createUser(
      username: string,
      password: string,
      role: 'admin' | 'user'
    ): Effect.Effect<UserPublic, UserStoreError | UsernameTakenError>
    listUsers(): Effect.Effect<ReadonlyArray<UserPublic>, UserStoreError>
    updateTotp(
      userId: string,
      secret: string,
      backupCodes: ReadonlyArray<string>
    ): Effect.Effect<void, UserStoreError | UserNotFoundError | TotpAlreadyEnabledError>
    markBackupCodeUsed(userId: string, index: number): Effect.Effect<void, UserStoreError | UserNotFoundError>
    redeemBackupCode(
      userId: string,
      code: string
    ): Effect.Effect<Option.Option<number>, UserStoreError | UserNotFoundError>
  }
>()('@bbbook/api/modules/auth/UserRepository') {}

const hashPassword = (password: string) =>
  Effect.try({
    try: () => bcrypt.hashSync(password, 12),
    catch: (cause) => new UserStoreError({ message: 'Failed to hash password', cause }),
  })

const encryptOption = (maybe: Option.Option<string>): Option.Option<string> =>
  Option.map(maybe, encryptSecret)

const decryptUser = (user: User): User =>
  User.make({ ...user, totpSecret: Option.map(user.totpSecret, decryptSecret) })

const userFields = (user: User) => ({
  id: user.id,
  username: user.username,
  passwordHash: user.passwordHash,
  role: user.role,
  totpSecret: user.totpSecret,
  totpEnabled: user.totpEnabled,
  backupCodes: user.backupCodes,
  backupCodesUsed: user.backupCodesUsed,
})

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const repo = yield* SqlModel.makeRepository(User, {
      tableName: 'users',
      idColumn: 'id',
      spanPrefix: 'Users',
    })

    const inTransaction = <A, E>(effect: Effect.Effect<A, E, never>) =>
      sql.withTransaction(effect).pipe(
        Effect.catchTag('SqlError', (error) => Effect.die(error))
      )

    const findByUsername = Effect.fn('UserRepository.findByUsername')(function* (username: string) {
      const maybeUser = yield* SqlSchema.findOneOption({
        Request: Schema.String,
        Result: User,
        execute: (name) => sql`SELECT * FROM users WHERE username = ${name}`,
      })(username).pipe(
        Effect.map((maybeUser) => Option.map(maybeUser, decryptUser)),
        Effect.catchTags({
          SqlError: Effect.die,
          SchemaError: Effect.die,
        })
      )
      return maybeUser
    })

    const findById = Effect.fn('UserRepository.findById')(function* (userId: string) {
      const maybeUser = yield* repo.findById(userId as UserId).pipe(
        Effect.map((user) => Option.some(decryptUser(user))),
        Effect.catchTags({
          NoSuchElementError: () => Effect.succeed(Option.none<User>()),
          SqlError: Effect.die,
          SchemaError: Effect.die,
        })
      )
      return maybeUser
    })

    const verifyPassword = Effect.fn('UserRepository.verifyPassword')(function* (user: User, password: string) {
      const valid = yield* Effect.try({
        try: () => bcrypt.compareSync(password, user.passwordHash),
        catch: (cause) => new UserStoreError({ message: 'Password verification failed', cause }),
      }).pipe(Effect.orElseSucceed(() => false))
      return valid
    })

    const updateTotp = Effect.fn('UserRepository.updateTotp')(function* (
      userId: string,
      secret: string,
      backupCodes: ReadonlyArray<string>
    ) {
      yield* inTransaction(
        Effect.gen(function* () {
          const maybeUser = yield* findById(userId)
          if (Option.isNone(maybeUser)) {
            return yield* new UserNotFoundError({ message: 'User not found' })
          }
          const user = maybeUser.value
          if (user.totpEnabled) {
            return yield* new TotpAlreadyEnabledError({ message: 'TOTP is already enabled for this account' })
          }
          const update = User.update.make({
            ...userFields(user),
            totpSecret: Option.some(encryptSecret(secret)),
            totpEnabled: true,
            backupCodes,
            backupCodesUsed: Array(backupCodes.length).fill(false) as ReadonlyArray<boolean>,
          })
          yield* repo.update(update).pipe(Effect.orDie)
        })
      )
    })

    const markBackupCodeUsed = Effect.fn('UserRepository.markBackupCodeUsed')(function* (
      userId: string,
      index: number
    ) {
      yield* inTransaction(
        Effect.gen(function* () {
          const maybeUser = yield* findById(userId)
          if (Option.isNone(maybeUser)) {
            return yield* new UserNotFoundError({ message: 'User not found' })
          }
          const user = maybeUser.value
          if (index < 0 || index >= user.backupCodesUsed.length) {
            return yield* new UserStoreError({ message: 'Backup code index out of range' })
          }
          const used = [...user.backupCodesUsed]
          used[index] = true
          const update = User.update.make({
            ...userFields(user),
            totpSecret: encryptOption(user.totpSecret),
            backupCodesUsed: used as ReadonlyArray<boolean>,
          })
          yield* repo.update(update).pipe(Effect.orDie)
        })
      )
    })

    const redeemBackupCode = Effect.fn('UserRepository.redeemBackupCode')(function* (
      userId: string,
      code: string
    ) {
      const result = yield* inTransaction(
        Effect.gen(function* () {
          const maybeUser = yield* findById(userId)
          if (Option.isNone(maybeUser)) {
            return yield* new UserNotFoundError({ message: 'User not found' })
          }
          const user = maybeUser.value
          for (let i = 0; i < user.backupCodes.length; i++) {
            if (user.backupCodesUsed[i]) continue
            const match = yield* Effect.try({
              try: () => bcrypt.compareSync(code, user.backupCodes[i]),
              catch: (cause) => new UserStoreError({ message: 'Backup code verification failed', cause }),
            })
            if (match) {
              const used = [...user.backupCodesUsed]
              used[i] = true
              const update = User.update.make({
                ...userFields(user),
                totpSecret: encryptOption(user.totpSecret),
                backupCodesUsed: used as ReadonlyArray<boolean>,
              })
              yield* repo.update(update).pipe(Effect.orDie)
              return Option.some(i)
            }
          }
          return Option.none<number>()
        })
      )
      return result
    })

    const createUser = Effect.fn('UserRepository.createUser')(function* (
      username: string,
      password: string,
      role: 'admin' | 'user'
    ) {
      const existing = yield* findByUsername(username)
      if (Option.isSome(existing)) {
        return yield* new UsernameTakenError({ message: 'Username already taken' })
      }
      const passwordHash = yield* hashPassword(password).pipe(Effect.orDie)
      const newUser = User.insert.make({
        username,
        passwordHash,
        role,
        totpSecret: Option.none(),
        totpEnabled: false,
        backupCodes: [] as ReadonlyArray<string>,
        backupCodesUsed: [] as ReadonlyArray<boolean>,
      })
      const inserted = yield* repo.insert(newUser).pipe(
        Effect.catchTags({
          SqlError: (error) => {
            if (
              error.reason._tag === 'UniqueViolation' &&
              error.reason.constraint.includes('username')
            ) {
              return Effect.fail(new UsernameTakenError({ message: 'Username already taken' }))
            }
            return Effect.fail(new UserStoreError({ message: 'Failed to create user', cause: error }))
          },
          SchemaError: Effect.die,
        })
      )
      const publicUser: UserPublic = {
        id: inserted.id,
        username: inserted.username,
        role: inserted.role,
        totpEnabled: inserted.totpEnabled,
      }
      return publicUser
    })

    const listUsers = Effect.fn('UserRepository.listUsers')(function* () {
      const users = yield* SqlSchema.findAll({
        Request: Schema.Void,
        Result: UserPublic,
        execute: () => sql`SELECT id, username, role, totpEnabled FROM users ORDER BY createdAt`,
      })().pipe(Effect.orDie)
      return users
    })

    const seedUsers = Effect.fn('UserRepository.seedUsers')(function* () {
      let seeds = AUTH_SEED_USERS ?? []
      if (seeds.length === 0 && AUTH_DEFAULT_ADMIN_PASSWORD) {
        seeds = [{ username: 'admin', password: AUTH_DEFAULT_ADMIN_PASSWORD }]
      }
      if (seeds.length === 0) {
        const countResult = yield* sql`SELECT COUNT(*) as count FROM users`.raw.pipe(Effect.orDie)
        const rows = countResult as ReadonlyArray<{ count: number | bigint }>
        const count = typeof rows[0]?.count === 'bigint' ? Number(rows[0].count) : (rows[0]?.count ?? 0)
        if (count === 0) {
          const randomPassword = randomBytes(16).toString('base64')
          const passwordFile = `${STORAGE_PATH}/.admin-password`
          yield* Effect.tryPromise({
            try: () => writeFile(passwordFile, randomPassword, { mode: 0o600 }),
            catch: (cause) => new UserStoreError({ message: 'Failed to write default admin password file', cause }),
          }).pipe(Effect.orDie)
          const insertAdmin = sql.withTransaction(
            Effect.gen(function* () {
              const passwordHash = yield* hashPassword(randomPassword).pipe(Effect.orDie)
              const newUser = User.insert.make({
                username: 'admin',
                passwordHash,
                role: 'admin',
                totpSecret: Option.none(),
                totpEnabled: false,
                backupCodes: [] as ReadonlyArray<string>,
                backupCodesUsed: [] as ReadonlyArray<boolean>,
              })
              yield* repo.insert(newUser).pipe(Effect.orDie)
              logger.info('Seeded user: admin (random password written to .admin-password)')
            })
          ).pipe(
            Effect.catchTag('SqlError', (error) =>
              Effect.gen(function* () {
                yield* Effect.promise(() => unlink(passwordFile).catch(() => undefined))
                return yield* Effect.die(error)
              })
            )
          )
          yield* insertAdmin
          return
        }
      }
      for (const seed of seeds) {
        const existing = yield* findByUsername(seed.username)
        if (Option.isSome(existing)) {
          yield* sql`UPDATE users SET role = ${'admin'} WHERE username = ${seed.username}`.pipe(Effect.orDie)
          continue
        }
        const passwordHash = yield* hashPassword(seed.password).pipe(Effect.orDie)
        const newUser = User.insert.make({
          username: seed.username,
          passwordHash,
          role: 'admin',
          totpSecret: Option.none(),
          totpEnabled: false,
          backupCodes: [] as ReadonlyArray<string>,
          backupCodesUsed: [] as ReadonlyArray<boolean>,
        })
        yield* repo.insert(newUser).pipe(Effect.orDie)
        logger.info(`Seeded user: ${seed.username}`)
      }
    })

    yield* seedUsers().pipe(Effect.orDie)

    return UserRepository.of({
      findByUsername,
      findById,
      verifyPassword,
      createUser,
      listUsers,
      updateTotp,
      markBackupCodeUsed,
      redeemBackupCode,
    })
  })
).pipe(Layer.provide(SqlLive), Layer.orDie)
