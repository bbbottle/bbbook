import { Model } from 'effect/unstable/schema'
import { Schema } from 'effect'

const UserId = Schema.String.pipe(Schema.brand('UserId'))
export type UserId = typeof UserId.Type

export const Role = Schema.Literals(['admin', 'user'])
export type Role = typeof Role.Type

export class User extends Model.Class<User>('User')({
  id: Model.UuidV4Insert(UserId),
  username: Schema.String,
  passwordHash: Schema.String,
  role: Role,
  totpSecret: Model.FieldOption(Schema.String),
  totpEnabled: Model.BooleanSqlite,
  backupCodes: Model.JsonFromString(Schema.Array(Schema.String)),
  backupCodesUsed: Model.JsonFromString(Schema.Array(Schema.Boolean)),
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
}) {}

export const UserPublic = Schema.Struct({
  id: Schema.String,
  username: Schema.String,
  role: Role,
  totpEnabled: Schema.BooleanFromBit,
})
export type UserPublic = Schema.Schema.Type<typeof UserPublic>

export const CurrentUserResponseSchema = Schema.Struct({
  id: Schema.String,
  username: Schema.String,
  role: Role,
})
export type CurrentUserResponse = Schema.Schema.Type<typeof CurrentUserResponseSchema>

const Username = Schema.String.check(Schema.isMinLength(1)).check(Schema.isMaxLength(64))
const Password = Schema.String.check(Schema.isMinLength(1)).check(Schema.isMaxLength(256))
const TempToken = Schema.String.check(Schema.isMaxLength(4096))
const TotpSecret = Schema.String.check(Schema.isMaxLength(128))
const TotpToken = Schema.String.check(Schema.isLengthBetween(4, 10))
const BackupCode = Schema.String.check(Schema.isMinLength(1)).check(Schema.isMaxLength(64))

export const LoginRequestSchema = Schema.Struct({
  username: Username,
  password: Schema.optional(Password),
  token: Schema.optional(TotpToken),
})
export type LoginRequest = Schema.Schema.Type<typeof LoginRequestSchema>

export const LoginResponseSchema = Schema.Union([
  Schema.Struct({
    stage: Schema.Literal('setup'),
    tempToken: Schema.String,
  }),
  Schema.Struct({
    stage: Schema.Literal('verify'),
    tempToken: Schema.String,
  }),
  Schema.Struct({
    stage: Schema.Literal('authed'),
    sessionToken: Schema.String,
  }),
])
export type LoginResponse = Schema.Schema.Type<typeof LoginResponseSchema>

export const TotpSetupRequestSchema = Schema.Struct({
  tempToken: TempToken,
})
export type TotpSetupRequest = Schema.Schema.Type<typeof TotpSetupRequestSchema>

export const TotpSetupResponseSchema = Schema.Struct({
  secret: Schema.String,
  uri: Schema.String,
  qrCodeDataUrl: Schema.String,
})
export type TotpSetupResponse = Schema.Schema.Type<typeof TotpSetupResponseSchema>

export const TotpConfirmRequestSchema = Schema.Struct({
  tempToken: TempToken,
  secret: TotpSecret,
  token: TotpToken,
})
export type TotpConfirmRequest = Schema.Schema.Type<typeof TotpConfirmRequestSchema>

export const TotpConfirmResponseSchema = Schema.Struct({
  backupCodes: Schema.Array(Schema.String),
})
export type TotpConfirmResponse = Schema.Schema.Type<typeof TotpConfirmResponseSchema>

export const TotpVerifyRequestSchema = Schema.Struct({
  tempToken: TempToken,
  token: TotpToken,
})
export type TotpVerifyRequest = Schema.Schema.Type<typeof TotpVerifyRequestSchema>

export const TotpVerifyResponseSchema = Schema.Struct({
  sessionToken: Schema.String,
})
export type TotpVerifyResponse = Schema.Schema.Type<typeof TotpVerifyResponseSchema>

export const BackupCodeRequestSchema = Schema.Struct({
  tempToken: TempToken,
  code: BackupCode,
})
export type BackupCodeRequest = Schema.Schema.Type<typeof BackupCodeRequestSchema>

export const BackupCodeResponseSchema = Schema.Struct({
  sessionToken: Schema.String,
})
export type BackupCodeResponse = Schema.Schema.Type<typeof BackupCodeResponseSchema>
