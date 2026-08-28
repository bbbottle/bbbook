import { Effect } from 'effect'
import type { KindleConnection } from '../core/connection.js'

const remoteScreenshotPath = '/var/tmp/screen.png'

export const takeScreenshot = (connection: KindleConnection, localPath: string) =>
  Effect.gen(function* () {
    yield* connection.exec(
      `fbgrab -f /dev/fb0 ${remoteScreenshotPath} 2>/dev/null || eips -f -g ${remoteScreenshotPath} 2>/dev/null`
    )
    yield* connection.uploadFile(localPath, remoteScreenshotPath)
    return localPath
  })
