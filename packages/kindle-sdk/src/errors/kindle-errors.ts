import { Schema } from 'effect'

export class TimeoutError extends Schema.TaggedError<TimeoutError>()("TimeoutError", {
  command: Schema.String,
  timeoutMs: Schema.Number,
}) {}

export class DeviceBusyError extends Schema.TaggedError<DeviceBusyError>()("DeviceBusyError", {
  command: Schema.String,
}) {}

export class PermissionDeniedError extends Schema.TaggedError<PermissionDeniedError>()("PermissionDeniedError", {
  command: Schema.String,
}) {}

export class ConnectionLostError extends Schema.TaggedError<ConnectionLostError>()("ConnectionLostError", {
  cause: Schema.optional(Schema.Unknown),
}) {}

export class DeviceUnavailableError extends Schema.TaggedError<DeviceUnavailableError>()("DeviceUnavailableError", {
  lastSeenAt: Schema.Number,
}) {}

export class DeviceSleepingError extends Schema.TaggedError<DeviceSleepingError>()("DeviceSleepingError", {}) {}

export class QueueFullError extends Schema.TaggedError<QueueFullError>()("QueueFullError", {
  queueSize: Schema.Number,
}) {}

export class ResourceExhaustedError extends Schema.TaggedError<ResourceExhaustedError>()("ResourceExhaustedError", {
  resource: Schema.String,
  current: Schema.optional(Schema.Number),
  threshold: Schema.Number,
}) {}

export class ParseError extends Schema.TaggedError<ParseError>()("ParseError", {
  input: Schema.String,
  message: Schema.String,
}) {}

export class FontValidationError extends Schema.TaggedError<FontValidationError>()("FontValidationError", {
  path: Schema.String,
  reason: Schema.String,
}) {}

export class CommandRejectedError extends Schema.TaggedError<CommandRejectedError>()("CommandRejectedError", {
  command: Schema.String,
  reason: Schema.String,
}) {}

export type KindleError =
  | TimeoutError
  | DeviceBusyError
  | PermissionDeniedError
  | ConnectionLostError
  | DeviceUnavailableError
  | DeviceSleepingError
  | QueueFullError
  | ResourceExhaustedError
  | ParseError
  | FontValidationError
  | CommandRejectedError
