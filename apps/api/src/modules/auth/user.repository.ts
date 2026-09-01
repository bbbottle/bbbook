import { Context, Effect, Layer, Option } from 'effect'
import bcrypt from 'bcryptjs'
import { loadUsers, updateUsers } from '../../lib/user-store.js'
import { UserStoreError } from '../../shared/schema/errors.js'
import { TotpAlreadyEnabledError, UserNotFoundError } from './errors.js'
import type { User } from './schema.js'

export class UserRepository extends Context.Service<UserRepository, {
  findByUsername(username: string): Effect.Effect<Option.Option<User>, UserStoreError>
  findById(userId: string): Effect.Effect<Option.Option<User>, UserStoreError>
  verifyPassword(user: User, password: string): Effect.Effect<boolean, never>
  updateTotp(
    userId: string,
    secret: string,
    backupCodes: ReadonlyArray<string>
  ): Effect.Effect<void, UserStoreError | UserNotFoundError | TotpAlreadyEnabledError>
  markBackupCodeUsed(userId: string, index: number): Effect.Effect<void, UserStoreError | UserNotFoundError>
  redeemBackupCode(userId: string, code: string): Effect.Effect<Option.Option<number>, UserStoreError | UserNotFoundError>
}>()("@bbbook/api/modules/auth/UserRepository") {}

const findByUsername = Effect.fn('UserRepository.findByUsername')(function*(username: string) {
  const users = yield* loadUsers()
  const user = users.find((u) => u.username === username)
  return user ? Option.some(user) : Option.none()
})

const findById = Effect.fn('UserRepository.findById')(function*(userId: string) {
  const users = yield* loadUsers()
  const user = users.find((u) => u.id === userId)
  return user ? Option.some(user) : Option.none()
})

const verifyPassword = Effect.fn('UserRepository.verifyPassword')(function*(user: User, password: string) {
  return yield* Effect.sync(() => bcrypt.compareSync(password, user.passwordHash))
})

const updateTotp = Effect.fn('UserRepository.updateTotp')(function*(
  userId: string,
  secret: string,
  backupCodes: ReadonlyArray<string>
) {
  const updater = (users: ReadonlyArray<User>) =>
    Effect.gen(function*() {
      const index = users.findIndex((u) => u.id === userId)
      if (index === -1) {
        return yield* new UserNotFoundError({ message: 'User not found' })
      }
      const user = users[index]
      if (user.totpEnabled) {
        return yield* new TotpAlreadyEnabledError({ message: 'TOTP is already enabled for this account' })
      }
      const updated: User = {
        ...user,
        totpSecret: Option.some(secret),
        totpEnabled: true,
        backupCodes,
        backupCodesUsed: Array(backupCodes.length).fill(false),
      }
      return { users: [...users.slice(0, index), updated, ...users.slice(index + 1)], result: undefined }
    })

  return yield* updateUsers(updater)
})

const markBackupCodeUsed = Effect.fn('UserRepository.markBackupCodeUsed')(function*(userId: string, index: number) {
  const updater = (users: ReadonlyArray<User>) =>
    Effect.gen(function*() {
      const userIndex = users.findIndex((u) => u.id === userId)
      if (userIndex === -1) {
        return yield* new UserNotFoundError({ message: 'User not found' })
      }
      const user = users[userIndex]
      if (index < 0 || index >= user.backupCodesUsed.length) {
        return yield* new UserStoreError({ message: 'Backup code index out of range' })
      }
      const updated: User = {
        ...user,
        backupCodesUsed: user.backupCodesUsed.map((used, i) => (i === index ? true : used)),
      }
      return { users: [...users.slice(0, userIndex), updated, ...users.slice(userIndex + 1)], result: undefined }
    })

  return yield* updateUsers(updater)
})

const redeemBackupCode = Effect.fn('UserRepository.redeemBackupCode')(function*(userId: string, code: string) {
  const updater = (users: ReadonlyArray<User>) =>
    Effect.gen(function*() {
      const userIndex = users.findIndex((u) => u.id === userId)
      if (userIndex === -1) {
        return yield* new UserNotFoundError({ message: 'User not found' })
      }
      const user = users[userIndex]
      for (let i = 0; i < user.backupCodes.length; i++) {
        if (user.backupCodesUsed[i]) continue
        const match = yield* Effect.sync(() => bcrypt.compareSync(code, user.backupCodes[i]))
        if (match) {
          const updated: User = {
            ...user,
            backupCodesUsed: user.backupCodesUsed.map((used, idx) => (idx === i ? true : used)),
          }
          return {
            users: [...users.slice(0, userIndex), updated, ...users.slice(userIndex + 1)],
            result: Option.some(i),
          }
        }
      }
      return { users, result: Option.none() }
    })

  return yield* updateUsers(updater)
})

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function*() {
    return UserRepository.of({
      findByUsername,
      findById,
      verifyPassword,
      updateTotp,
      markBackupCodeUsed,
      redeemBackupCode,
    })
  })
)
