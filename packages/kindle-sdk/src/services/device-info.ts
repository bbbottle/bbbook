import { Effect, Context, Option } from 'effect'
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
    const run = (command: string) =>
      commandQueue.enqueue(command).pipe(
        Effect.map((r) => r.stdout.trim())
      )

    const runOptional = (command: string) =>
      run(command).pipe(
        Effect.map((r) => r.trim()),
        Effect.option
      )

    const parseWifiSignal = (text?: string) => {
      const m = text?.trim().match(/^(\d+)\/\d+$/)
      return m ? parseInt(m[1], 10) : undefined
    }

    const parseWifiSsid = (text?: string) => {
      if (!text) return undefined
      const m = text.match(/essid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^,\s}]+))/i)
      return m?.[1] || m?.[2] || m?.[3] || undefined
    }

    const getDeviceInfo = () =>
      Effect.gen(function* () {
        const [firmware, model, serial, uptime, memory, storage, battery, charging, cmState, signalStrength, ssidOutput] = yield* Effect.all([
          run(DeviceInfoCommands.getFirmwareVersion()),
          run(DeviceInfoCommands.getModel()),
          run(DeviceInfoCommands.getSerial()),
          run(DeviceInfoCommands.getUptime()),
          run(DeviceInfoCommands.getFreeMemory()),
          run(DeviceInfoCommands.getFreeStorage()),
          run(Lipc.getBatteryLevel()),
          run(Lipc.getBatteryCharging()),
          runOptional(Lipc.getWifiConnected()),
          runOptional(Lipc.getWifiSignalStrength()),
          runOptional(Lipc.getWifiSsid()),
        ])

        const isConnected = Option.getOrUndefined(cmState)?.trim() === 'CONNECTED'
        const signalStrengthText = Option.getOrUndefined(signalStrength)
        const ssidText = Option.getOrUndefined(ssidOutput)
        const signal = isConnected ? parseWifiSignal(signalStrengthText) : undefined
        const ssid = isConnected ? parseWifiSsid(ssidText) : undefined
        const wifi = isConnected && (ssid !== undefined || signal !== undefined)
          ? { ssid, signal }
          : undefined

        const info: DeviceInfoShape = {
          firmwareVersion: firmware || 'unknown',
          modelName: model || 'unknown',
          serialNumber: serial || 'unknown',
          uptimeSeconds: parseNumber(uptime),
          freeMemoryMb: parseNumber(memory),
          freeStorageMb: parseNumber(storage),
          batteryLevel: parseNumber(battery),
          isCharging: charging.trim() === '1',
          wifi,
        }
        return info
      })

    return { getDeviceInfo }
  })
