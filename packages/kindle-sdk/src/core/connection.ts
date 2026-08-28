import { Effect } from 'effect'
import type { Client } from 'ssh2'
import * as Executor from './executor.js'
import type { KindleConnectionOptions } from '../types/index.js'

export class KindleConnection {
  readonly #options: KindleConnectionOptions
  #client?: Client

  constructor(options: KindleConnectionOptions) {
    this.#options = options
  }

  connect() {
    return Effect.gen({ self: this }, function* () {
      const client = yield* Executor.connect(this.#options)
      this.#client = client
      return client
    })
  }

  exec(command: string) {
    return Effect.gen({ self: this }, function* () {
      const client = yield* this.#requireClient()
      return yield* Executor.exec(client, command)
    })
  }

  uploadFile(localPath: string, remotePath: string) {
    return Effect.gen({ self: this }, function* () {
      const client = yield* this.#requireClient()
      return yield* Executor.uploadFile(client, localPath, remotePath)
    })
  }

  disconnect() {
    return Effect.gen({ self: this }, function* () {
      if (!this.#client) return
      yield* Executor.disconnect(this.#client)
      this.#client = undefined
    })
  }

  #requireClient() {
    return this.#client ? Effect.succeed(this.#client) : Effect.fail(new Error('Not connected'))
  }
}
