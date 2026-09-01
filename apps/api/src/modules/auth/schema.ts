import { Option, Schema } from 'effect'

export interface User {
  readonly id: string
  readonly username: string
  readonly passwordHash: string
  readonly totpSecret: Option.Option<string>
  readonly totpEnabled: boolean
  readonly backupCodes: ReadonlyArray<string>
  readonly backupCodesUsed: ReadonlyArray<boolean>
}

export const LoginRequestSchema = Schema.Struct({
  username: Schema.String,
  password: Schema.String,
})
export type LoginRequest = Schema.Schema.Type<typeof LoginRequestSchema>

export const LoginResponseSchema = Schema.Struct({
  stage: Schema.Union([Schema.Literal('setup'), Schema.Literal('verify')]),
  tempToken: Schema.String,
})
export type LoginResponse = Schema.Schema.Type<typeof LoginResponseSchema>

export const TotpSetupRequestSchema = Schema.Struct({
  tempToken: Schema.String,
})
export type TotpSetupRequest = Schema.Schema.Type<typeof TotpSetupRequestSchema>

export const TotpSetupResponseSchema = Schema.Struct({
  secret: Schema.String,
  uri: Schema.String,
  qrCodeDataUrl: Schema.String,
})
export type TotpSetupResponse = Schema.Schema.Type<typeof TotpSetupResponseSchema>

export const TotpConfirmRequestSchema = Schema.Struct({
  tempToken: Schema.String,
  secret: Schema.String,
  token: Schema.String,
})
export type TotpConfirmRequest = Schema.Schema.Type<typeof TotpConfirmRequestSchema>

export const TotpConfirmResponseSchema = Schema.Struct({
  backupCodes: Schema.Array(Schema.String),
})
export type TotpConfirmResponse = Schema.Schema.Type<typeof TotpConfirmResponseSchema>

export const TotpVerifyRequestSchema = Schema.Struct({
  tempToken: Schema.String,
  token: Schema.String,
})
export type TotpVerifyRequest = Schema.Schema.Type<typeof TotpVerifyRequestSchema>

export const TotpVerifyResponseSchema = Schema.Struct({
  sessionToken: Schema.String,
})
export type TotpVerifyResponse = Schema.Schema.Type<typeof TotpVerifyResponseSchema>

export const BackupCodeRequestSchema = Schema.Struct({
  tempToken: Schema.String,
  code: Schema.String,
})
export type BackupCodeRequest = Schema.Schema.Type<typeof BackupCodeRequestSchema>

export const BackupCodeResponseSchema = Schema.Struct({
  sessionToken: Schema.String,
})
export type BackupCodeResponse = Schema.Schema.Type<typeof BackupCodeResponseSchema>
