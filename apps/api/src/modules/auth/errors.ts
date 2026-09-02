import { Schema } from 'effect'

export class UserNotFoundError extends Schema.TaggedError<UserNotFoundError>()("UserNotFoundError", {
  message: Schema.String,
}) {}

export class InvalidCredentialError extends Schema.TaggedError<InvalidCredentialError>()("InvalidCredentialError", {
  message: Schema.String,
}) {}

export class TotpAlreadyEnabledError extends Schema.TaggedError<TotpAlreadyEnabledError>()("TotpAlreadyEnabledError", {
  message: Schema.String,
}) {}

export class TotpNotConfiguredError extends Schema.TaggedError<TotpNotConfiguredError>()("TotpNotConfiguredError", {
  message: Schema.String,
}) {}

export class InvalidTotpTokenError extends Schema.TaggedError<InvalidTotpTokenError>()("InvalidTotpTokenError", {
  message: Schema.String,
}) {}

export class InvalidBackupCodeError extends Schema.TaggedError<InvalidBackupCodeError>()("InvalidBackupCodeError", {
  message: Schema.String,
}) {}

export class TotpGenerationError extends Schema.TaggedError<TotpGenerationError>()("TotpGenerationError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class QrCodeError extends Schema.TaggedError<QrCodeError>()("QrCodeError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class InvalidTempTokenError extends Schema.TaggedError<InvalidTempTokenError>()("InvalidTempTokenError", {
  message: Schema.String,
}) {}

export class RateLimitedError extends Schema.TaggedError<RateLimitedError>()("RateLimitedError", {
  message: Schema.String,
  retryAfter: Schema.Number,
}) {}

export class UsernameTakenError extends Schema.TaggedError<UsernameTakenError>()("UsernameTakenError", {
  message: Schema.String,
}) {}

export class InvalidRequestError extends Schema.TaggedError<InvalidRequestError>()("InvalidRequestError", {
  message: Schema.String,
}) {}
