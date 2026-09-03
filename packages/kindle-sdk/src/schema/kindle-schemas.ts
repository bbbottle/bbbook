import { Schema } from 'effect'

export const BookSchema = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  author: Schema.optional(Schema.String),
  path: Schema.optional(Schema.String),
  coverUrl: Schema.optional(Schema.String),
})

export const FontSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  path: Schema.String,
})

export const WallpaperSchema = Schema.Struct({
  id: Schema.String,
  localPath: Schema.String,
  remotePath: Schema.String,
})

export const DeviceInfoSchema = Schema.Struct({
  firmwareVersion: Schema.String,
  modelName: Schema.String,
  serialNumber: Schema.String,
  batteryLevel: Schema.Number,
  isCharging: Schema.Boolean,
  uptimeSeconds: Schema.Number,
  freeMemoryMb: Schema.Number,
  freeStorageMb: Schema.Number,
  wifi: Schema.optional(Schema.Struct({
    ssid: Schema.optional(Schema.String),
    signal: Schema.optional(Schema.Number),
  })),
})
