import { Effect } from 'effect'
import { KindleConnection } from './core/connection.js'
import type { KindleConnectionOptions } from './types/index.js'
import * as Battery from './services/battery.js'
import * as BookManager from './services/bookManager.js'
import * as Screenshot from './services/screenshot.js'
import type { KindleDeviceInfo } from '@bbbook/shared-types'

export type { KindleConnectionOptions }
export { KindleConnection }
export * as Battery from './services/battery.js'
export * as BookManager from './services/bookManager.js'
export * as Screenshot from './services/screenshot.js'

export class Kindle {
  readonly #connection: KindleConnection

  private constructor(connection: KindleConnection) {
    this.#connection = connection
  }

  static make(options: KindleConnectionOptions): Effect.Effect<Kindle, Error, never> {
    return Effect.gen(function* () {
      const connection = new KindleConnection(options)
      yield* connection.connect()
      return new Kindle(connection)
    })
  }

  getDeviceInfo(): Effect.Effect<KindleDeviceInfo, Error, never> {
    return Effect.gen({ self: this }, function* () {
      const [level, charging] = yield* Effect.all([
        Battery.getBatteryLevel(this.#connection),
        Battery.isCharging(this.#connection),
      ])
      return {
        firmwareVersion: 'unknown',
        modelName: 'Kindle',
        batteryLevel: level,
        isCharging: charging,
      }
    })
  }

  listBooks(folder?: string) {
    return BookManager.listBooks(this.#connection, folder)
  }

  uploadBook(localPath: string, remoteFolder?: string) {
    return BookManager.uploadBook(this.#connection, localPath, remoteFolder)
  }

  openBook(bookPath: string) {
    return BookManager.openBook(this.#connection, bookPath)
  }

  takeScreenshot(localPath: string) {
    return Screenshot.takeScreenshot(this.#connection, localPath)
  }

  disconnect() {
    return this.#connection.disconnect()
  }
}
