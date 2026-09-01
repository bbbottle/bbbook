import { Context, Effect, Layer, Option } from 'effect'
import bcrypt from 'bcryptjs'
import { loadUsers, saveUsers } from '../../lib/user-store.js'
import { UserStoreError } from '../../shared/schema/errors.js'
import { UserNotFoundError } from './errors.js'
import type { User } from './schema.js'

export class UserRepository extends Context.Service<UserRepository, {
  findByUsername(username: string): Effect.Effect<Option.Option<User>, UserStoreError>
  findById(userId: string): Effect.Effect<Option.Option<User>, UserStoreError>
  verifyPassword(user: User, password: string): Effect.Effect<boolean, never>
  updateTotp(
    userId: string,
    secret: string,
    backupCodes: ReadonlyArray<string>
  ): Effect.Effect<void, UserStoreError | UserNotFoundError>
  markBackupCodeUsed(userId: string, index: number): Effect.Effect<void, UserStoreError | UserNotFoundError>
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
  const users = yield* loadUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index === -1) {
    return yield* new UserNotFoundError({ message: 'User not found' })
  }
  const updated = [...users]
  updated[index] = {
    ...users[index],
    totpSecret: Option.some(secret),
    totpEnabled: true,
    backupCodes,
    backupCodesUsed: Array(backupCodes.length).fill(false),
  }
  yield* saveUsers(updated)
})

const markBackupCodeUsed = Effect.fn('UserRepository.markBackupCodeUsed')(function*(userId: string, index: number) {
  const users = yield* loadUsers()
  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex === -1) {
    return yield* new UserNotFoundError({ message: 'User not found' })
  }
  const user = users[userIndex]
  if (index < 0 || index >= user.backupCodesUsed.length) {
    return yield* new UserStoreError({ message: 'Backup code index out of range' })
  }
  const updated = [...users]
  updated[userIndex] = {
    ...user,
    backupCodesUsed: user.backupCodesUsed.map((used, i) => (i === index ? true : used)),
  }
  yield* saveUsers(updated)
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
    })
  })
)
