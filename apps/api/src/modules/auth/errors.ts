import { Schema } from 'effect'

export class UserNotFound extends Schema.TaggedError<UserNotFound>()('UserNotFound', {}, { httpApiStatus: 404 }) {}

export class InvalidCredentials extends Schema.TaggedError<InvalidCredentials>()(
  'InvalidCredentials',
  {},
  { httpApiStatus: 401 }
) {}

export class InvalidToken extends Schema.TaggedError<InvalidToken>()('InvalidToken', {}, { httpApiStatus: 401 }) {}

export class TotpSetupRequired extends Schema.TaggedError<TotpSetupRequired>()(
  'TotpSetupRequired',
  {},
  { httpApiStatus: 403 }
) {}

export class TotpAlreadyBound extends Schema.TaggedError<TotpAlreadyBound>()(
  'TotpAlreadyBound',
  {},
  { httpApiStatus: 409 }
) {}

export class InvalidTotp extends Schema.TaggedError<InvalidTotp>()('InvalidTotp', {}, { httpApiStatus: 401 }) {}

export class BackupCodeUsed extends Schema.TaggedError<BackupCodeUsed>()('BackupCodeUsed', {}, { httpApiStatus: 401 }) {}

export class InternalAuthError extends Schema.TaggedError<InternalAuthError>()(
  'InternalAuthError',
  {},
  { httpApiStatus: 500 }
) {}

export type AuthError =
  | UserNotFound
  | InvalidCredentials
  | InvalidToken
  | TotpSetupRequired
  | TotpAlreadyBound
  | InvalidTotp
  | BackupCodeUsed
  | InternalAuthError
