import { assert, describe, it } from '@effect/vitest'
import { Effect, Schema } from 'effect'
import {
  BookSchema,
  DeviceInfoSchema,
  FontSchema,
  WallpaperSchema,
} from './kindle-schemas.js'

describe('kindle schemas', () => {
  it.effect('DeviceInfoSchema decodes a valid device info', () =>
    Effect.gen(function* () {
      const info = {
        firmwareVersion: '5.15.1',
        modelName: 'Kindle Paperwhite',
        serialNumber: '12345',
        batteryLevel: 75,
        isCharging: false,
        uptimeSeconds: 3600,
        freeMemoryMb: 256,
        freeStorageMb: 1024,
      }
      const decoded = yield* Schema.decodeUnknownEffect(DeviceInfoSchema)(info)
      assert.strictEqual(decoded.batteryLevel, 75)
      assert.strictEqual(decoded.modelName, 'Kindle Paperwhite')
      assert.strictEqual(decoded.serialNumber, '12345')
    }))

  it.effect('BookSchema decodes a valid book with optional fields', () =>
    Effect.gen(function* () {
      const book = { id: '1', title: 'Test Book' }
      const decoded = yield* Schema.decodeUnknownEffect(BookSchema)(book)
      assert.strictEqual(decoded.title, 'Test Book')
      assert.strictEqual(decoded.author, undefined)
    }))

  it.effect('FontSchema decodes a valid font', () =>
    Effect.gen(function* () {
      const font = { id: '1', name: 'Custom', path: '/mnt/us/fonts/custom.ttf' }
      const decoded = yield* Schema.decodeUnknownEffect(FontSchema)(font)
      assert.strictEqual(decoded.name, 'Custom')
    }))

  it.effect('WallpaperSchema decodes a valid wallpaper', () =>
    Effect.gen(function* () {
      const wallpaper = {
        id: '1',
        localPath: '/tmp/wallpaper.png',
        remotePath: '/mnt/us/wallpaper.png',
      }
      const decoded = yield* Schema.decodeUnknownEffect(WallpaperSchema)(wallpaper)
      assert.strictEqual(decoded.remotePath, '/mnt/us/wallpaper.png')
    }))

  it.effect('DeviceInfoSchema fails on invalid input', () =>
    Effect.gen(function* () {
      const error = yield* Effect.flip(
        Schema.decodeUnknownEffect(DeviceInfoSchema)({ batteryLevel: 'high' })
      )
      assert.strictEqual(error._tag, 'SchemaError')
    }))
})
