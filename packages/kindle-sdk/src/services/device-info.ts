import { Effect, Context } from 'effect'
import type { CommandQueueService } from './command-queue.js'
import * as DeviceInfoCommands from '../commands/device-info.js'
import * as Lipc from '../commands/lipc.js'
import { ParseError, type KindleError } from '../errors/kindle-errors.js'
import type { DeviceInfo as DeviceInfoShape } from '../types/index.js'

export interface DeviceInfoService {
  readonly getDeviceInfo: () => Effect.Effect<DeviceInfoShape, KindleError>
}

export class DeviceInfo extends Context.Service<DeviceInfo, DeviceInfoService>()(
  '@bbbook/kindle-sdk/DeviceInfo'
) {}

const parseNumber = (text: string) => {
  const n = parseFloat(text.trim())
  return Number.isFinite(n) ? n : 0
}

export const make = (commandQueue: CommandQueueService) =>
  Effect.gen(function* () {
    const exec = (command: string) =>
      commandQueue.enqueue(command).pipe(
        Effect.map((r) => r.stdout.trim())
      )

    const getDeviceInfo = () =>
      Effect.gen(function* () {
        const [firmware, model, serial, uptime, memory, storage, battery, charging] = yield* Effect.all([
          exec(DeviceInfoCommands.getFirmwareVersion()),
          exec(DeviceInfoCommands.getModel()),
          exec(DeviceInfoCommands.getSerial()),
          exec(DeviceInfoCommands.getUptime()),
          exec(DeviceInfoCommands.getFreeMemory()),
          exec(DeviceInfoCommands.getFreeStorage()),
          exec(Lipc.getBatteryLevel()),
          exec(Lipc.getBatteryCharging()),
        ])

        const info: DeviceInfoShape = {
          firmwareVersion: firmware || 'unknown',
          modelName: model || 'unknown',
          serialNumber: serial || 'unknown',
          uptimeSeconds: parseNumber(uptime),
          freeMemoryMb: parseNumber(memory),
          freeStorageMb: parseNumber(storage),
          batteryLevel: parseNumber(battery),
          isCharging: charging.trim() === '1',
        }
        return info
      })

    return { getDeviceInfo }
  })
