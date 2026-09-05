import { Effect } from 'effect'
import { UserRepository } from '../auth/user.repository.js'
import { UserNotFoundError, UsernameTakenError } from '../auth/errors.js'
import { UserStoreError } from '../../shared/schema/errors.js'
import type { AdminCreateUserRequest, AdminCreateUserResponse } from './schema.js'

export const listUsers = Effect.fn('AdminProgram.listUsers')(function* () {
  const users = yield* UserRepository.use((repo) => repo.listUsers())
  return users
})

export const createUser = Effect.fn('AdminProgram.createUser')(function* (
  request: AdminCreateUserRequest
): Effect.fn.Return<AdminCreateUserResponse, UserStoreError | UsernameTakenError, UserRepository> {
  const user = yield* UserRepository.use((repo) =>
    repo.createUser(request.username, request.password, request.role ?? 'user')
  )
  return user
})

export const deleteUser = Effect.fn('AdminProgram.deleteUser')(function* (
  userId: string
): Effect.fn.Return<void, UserStoreError | UserNotFoundError, UserRepository> {
  yield* UserRepository.use((repo) => repo.deleteUser(userId))
})
