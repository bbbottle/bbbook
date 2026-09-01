import { Schema } from 'effect'

export class ApiError extends Schema.TaggedError<ApiError>()("ApiError", {
  message: Schema.String,
}) {}

export class KindleUnavailableError extends Schema.TaggedError<KindleUnavailableError>()(
  "KindleUnavailableError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  }
) {}
