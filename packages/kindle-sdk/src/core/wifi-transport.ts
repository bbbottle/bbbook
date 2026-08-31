import { Effect, Ref, Semaphore, Option, Duration, Context } from 'effect'
import { Client } from 'ssh2'
import * as Executor from './executor.js'
import {
  KindleError,
  ConnectionLostError,
  DeviceUnavailableError,
  DeviceSleepingError,
} from '../errors/kindle-errors.js'
import type { WifiTransportConfig, TransportState } from './transport-config.js'

export interface WifiTransportService {
  readonly state: Effect.Effect<TransportState>
  readonly withConnection: <A, E extends KindleError, R>(
    f: (client: Client) => Effect.Effect<A, E, R>
  ) => Effect.Effect<A, E | ConnectionLostError | DeviceUnavailableError | DeviceSleepingError, R>
  readonly recover: Effect.Effect<void, DeviceUnavailableError>
  readonly markSleeping: Effect.Effect<void>
  readonly markDisconnected: Effect.Effect<void>
}

export class WifiTransport extends Context.Service<WifiTransport, WifiTransportService>()(
  '@bbbook/kindle-sdk/WifiTransport'
) {}

const heartbeatCommand = 'echo kindle-pong'
const heartbeatResponse = 'kindle-pong'

export const make = (config: WifiTransportConfig) =>
  Effect.gen(function* () {
    const clientRef = yield* Ref.make<Option.Option<Client>>(Option.none())
    const stateRef = yield* Ref.make<TransportState>({ _tag: 'Disconnected' })
    const connectionSemaphore = yield* Semaphore.make(1)

    const setState = (state: TransportState) => Ref.set(stateRef, state)
    const getState = Ref.get(stateRef)

    const closeCurrent = Effect.gen(function* () {
      const maybeClient = yield* Ref.get(clientRef)
      yield* Ref.set(clientRef, Option.none())
      if (Option.isSome(maybeClient)) {
        yield* Executor.disconnect(maybeClient.value)
      }
    }).pipe(Effect.catch(() => Effect.void))

    const doConnect = Effect.gen(function* () {
      yield* closeCurrent
      const client = yield* Executor.connect(config).pipe(
        Effect.timeoutOrElse({
          duration: Duration.millis(config.connectionTimeout ?? 10000),
          orElse: () => Effect.fail(new ConnectionLostError({})),
        })
      )
      yield* Ref.set(clientRef, Option.some(client))
      yield* setState({ _tag: 'Connected' })
      return client
    })

    const ensureConnected = connectionSemaphore.withPermits(1)(
      Effect.gen(function* () {
        const state = yield* getState
        if (state._tag === 'Connected') {
          const maybeClient = yield* Ref.get(clientRef)
          if (Option.isSome(maybeClient)) {
            return maybeClient.value
          }
        }
        if (state._tag === 'Sleeping') {
          return yield* Effect.fail(new DeviceSleepingError({}))
        }
        return yield* doConnect
      })
    )

    const heartbeat = Effect.gen(function* () {
      const client = yield* ensureConnected
      const result = yield* Executor.exec(client, heartbeatCommand).pipe(
        Effect.timeoutOrElse({
          duration: Duration.millis(3000),
          orElse: () => Effect.fail(new ConnectionLostError({})),
        })
      )
      if (!result.stdout.trim().includes(heartbeatResponse)) {
        return yield* Effect.fail(new ConnectionLostError({}))
      }
    })

    const startHeartbeat = Effect.forever(
      heartbeat.pipe(
        Effect.catchTags({
          ConnectionLostError: () =>
            Effect.gen(function* () {
              yield* setState({ _tag: 'Disconnected' })
              yield* closeCurrent
              return void 0
            }),
          DeviceSleepingError: () =>
            Effect.gen(function* () {
              yield* setState({ _tag: 'Sleeping' })
              yield* closeCurrent
              return void 0
            }),
        }),
        Effect.tap(() => Effect.sleep(Duration.millis(config.heartbeatInterval ?? 5000)))
      )
    )

    const service: WifiTransportService = {
      state: getState,
      withConnection: (f) =>
        Effect.gen(function* () {
          const client = yield* ensureConnected
          return yield* f(client).pipe(
            Effect.timeoutOrElse({
              duration: Duration.millis(config.commandTimeout ?? 30000),
              orElse: () => Effect.fail(new ConnectionLostError({})),
            })
          )
        }).pipe(
          Effect.catch((error) =>
            Effect.gen(function* () {
              if (
                error._tag === 'ConnectionLostError' ||
                error._tag === 'DeviceUnavailableError' ||
                error._tag === 'DeviceSleepingError'
              ) {
                yield* setState(
                  error._tag === 'DeviceSleepingError'
                    ? { _tag: 'Sleeping' }
                    : { _tag: 'Disconnected' }
                )
                yield* closeCurrent
              }
              return yield* Effect.fail(error)
            })
          )
        ),
      recover: Effect.gen(function* () {
        const startedAt = Date.now()
        const state = yield* getState
        if (state._tag === 'Recovering' || state._tag === 'Connected') {
          return void 0
        }
        yield* setState({ _tag: 'Recovering' })
        const recovered = yield* doConnect.pipe(
          Effect.timeoutOrElse({
            duration: Duration.millis(10000),
            orElse: () => Effect.fail(new ConnectionLostError({})),
          }),
          Effect.option
        )
        if (Option.isSome(recovered)) {
          yield* setState({ _tag: 'Connected' })
          return void 0
        }
        yield* setState({ _tag: 'Disconnected' })
        return yield* Effect.fail(new DeviceUnavailableError({ lastSeenAt: startedAt }))
      }),
      markSleeping: Effect.gen(function* () {
        yield* setState({ _tag: 'Sleeping' })
        yield* closeCurrent
      }),
      markDisconnected: Effect.gen(function* () {
        yield* setState({ _tag: 'Disconnected' })
        yield* closeCurrent
      }),
    }

    yield* Effect.forkScoped(startHeartbeat)

    return service
  })
