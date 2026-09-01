import { Context, Effect } from 'effect'
import type { DeviceInfo } from '@bbbook/kindle-sdk'
import { KindleUnavailableError } from '../../shared/schema/errors.js'

export class KindleDeviceInfoService extends Context.Service<KindleDeviceInfoService, {
  getDeviceInfo(): Effect.Effect<DeviceInfo, KindleUnavailableError>
}>()("@bbbook/api/modules/kindle/KindleDeviceInfoService") {}
