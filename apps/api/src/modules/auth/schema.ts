import { Schema } from 'effect'
import { Model } from 'effect/unstable/schema'

export const UserId = Schema.String.pipe(Schema.brand('UserId'))
export type UserId = typeof UserId.Type

export class User extends Model.Class<User>('User')({
  id: Model.UuidV4Insert(UserId),
  username: Schema.String,
  passwordHash: Schema.String,
  totpSecret: Schema.NullOr(Schema.String),
  totpEnabled: Model.BooleanSqlite,
  backupCodes: Model.JsonFromString(Schema.Array(Schema.String)),
  backupCodesUsed: Model.JsonFromString(Schema.Array(Schema.Boolean)),
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate
}) {}

export class LoginRequest extends Schema.Class<LoginRequest>('LoginRequest')({
  username: Schema.String,
  password: Schema.String
}) {}

export class LoginResponse extends Schema.Class<LoginResponse>('LoginResponse')({
  requireTotp: Schema.Boolean,
  mfaToken: Schema.String
}) {}

export class SetupResponse extends Schema.Class<SetupResponse>('SetupResponse')({
  secret: Schema.String,
  qrCode: Schema.String,
  backupCodes: Schema.Array(Schema.String)
}) {}

export class ConfirmRequest extends Schema.Class<ConfirmRequest>('ConfirmRequest')({
  mfaToken: Schema.String,
  code: Schema.String
}) {}

export class TokenResponse extends Schema.Class<TokenResponse>('TokenResponse')({
  accessToken: Schema.String
}) {}

export class VerifyRequest extends Schema.Class<VerifyRequest>('VerifyRequest')({
  mfaToken: Schema.String,
  code: Schema.String
}) {}

export class MeResponse extends Schema.Class<MeResponse>('MeResponse')({
  id: Schema.String,
  username: Schema.String
}) {}
