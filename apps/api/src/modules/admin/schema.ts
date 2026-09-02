import { Schema } from 'effect'
import { Role, UserPublic } from '../auth/schema.js'

const Username = Schema.String.check(Schema.isMinLength(1)).check(Schema.isMaxLength(64))
const Password = Schema.String.check(Schema.isMinLength(1)).check(Schema.isMaxLength(256))

export const AdminCreateUserRequestSchema = Schema.Struct({
  username: Username,
  password: Password,
  role: Schema.optional(Role),
})
export type AdminCreateUserRequest = Schema.Schema.Type<typeof AdminCreateUserRequestSchema>

export const AdminCreateUserResponseSchema = UserPublic
export type AdminCreateUserResponse = Schema.Schema.Type<typeof AdminCreateUserResponseSchema>
