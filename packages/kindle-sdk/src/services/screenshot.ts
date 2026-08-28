import { Effect } from 'effect'
import type { KindleConnection } from '../core/connection.js'

const remoteScreenshotPath = '/var/tmp/screen.png'

export const takeScreenshot = (connection: KindleConnection, localPath: string) =>
  Effect.gen(function* () {
    yield* connection.exec(`fbgrab -f /dev/fb0 ${remoteScreenshotPath} 2>/dev/null`)
    yield* connection.downloadFile(remoteScreenshotPath, localPath)
    return localPath
  })
