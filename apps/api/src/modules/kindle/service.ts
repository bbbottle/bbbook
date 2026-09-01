import { Context, Effect } from 'effect'
import type { DeviceInfo } from '@bbbook/kindle-sdk'
import { KindleUnavailableError } from '../../shared/schema/errors.js'

export class KindleDeviceInfoService extends Context.Service<
  KindleDeviceInfoService,
  {
    getDeviceInfo(): Effect.Effect<{ readonly info: DeviceInfo; readonly stale: boolean }, KindleUnavailableError>
    refresh(): Effect.Effect<DeviceInfo, KindleUnavailableError>
    invalidateCache(): Effect.Effect<void>
  }
>()('@bbbook/api/modules/kindle/KindleDeviceInfoService') {}
