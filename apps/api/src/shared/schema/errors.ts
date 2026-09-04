import { Schema } from 'effect'

export class ApiError extends Schema.TaggedError<ApiError>()("ApiError", {
  message: Schema.String,
}) {}

export class UserStoreError extends Schema.TaggedError<UserStoreError>()("UserStoreError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export class KindleUnavailableError extends Schema.TaggedError<KindleUnavailableError>()(
  "KindleUnavailableError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  }
) {}

export class KindleSnapshotPendingError extends Schema.TaggedError<KindleSnapshotPendingError>()(
  "KindleSnapshotPendingError",
  {
    message: Schema.String,
  }
) {}
