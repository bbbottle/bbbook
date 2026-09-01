import { Effect, Context, Layer, ManagedRuntime } from 'effect'
import { type WifiTransportConfig, defaultWifiTransportConfig } from './core/transport-config.js'
import { WifiTransport, make as makeWifiTransport } from './core/wifi-transport.js'
import { ResourceThrottler, make as makeResourceThrottler } from './core/resource-throttler.js'
import { CommandExecutor, make as makeCommandExecutor } from './services/command-executor.js'
import { DeviceAvailability, make as makeDeviceAvailability } from './services/device-availability.js'
import { CommandQueue, make as makeCommandQueue } from './services/command-queue.js'
import { FileTransfer, make as makeFileTransfer } from './services/file-transfer.js'
import { PowerManager, make as makePowerManager } from './services/power-manager.js'
import { DeviceInfo, make as makeDeviceInfo } from './services/device-info.js'
import { Library, make as makeLibrary } from './services/library.js'
import { Screenshot, make as makeScreenshot } from './services/screenshot.js'
import { WallpaperManager, make as makeWallpaperManager } from './services/wallpaper.js'
import { FontManager, make as makeFontManager } from './services/font-manager.js'
import type { KindleConnectionOptions } from './types/index.js'

export { type KindleConnectionOptions, type DeviceInfo, type QueueItem, type Font, type Wallpaper } from './types/index.js'
export * from './errors/kindle-errors.js'
export { type Book } from '@bbbook/shared-types'

export interface KindleSDK {
  readonly isAvailable: () => Promise<boolean>
  readonly waitForAvailable: () => Promise<void>
  readonly lockScreen: () => Promise<void>
  readonly takeScreenshot: (localPath?: string) => Promise<void>
  readonly listBooks: () => Promise<ReadonlyArray<import('@bbbook/shared-types').Book>>
  readonly addBook: (localPath: string, fileName: string) => Promise<void>
  readonly removeBook: (fileName: string) => Promise<void>
  readonly restoreBook: (fileName: string) => Promise<void>
  readonly refreshLibrary: () => Promise<void>
  readonly applyWallpapers: (wallpapers: ReadonlyArray<import('./types/index.js').Wallpaper>) => Promise<void>
  readonly backupWallpapers: () => Promise<void>
  readonly restoreWallpapers: () => Promise<void>
  readonly listFonts: () => Promise<ReadonlyArray<import('./types/index.js').Font>>
  readonly addFont: (localPath: string, fileName: string) => Promise<void>
  readonly removeFont: (fileName: string) => Promise<void>
  readonly restoreFont: (fileName: string) => Promise<void>
  readonly refreshFontCache: () => Promise<void>
  readonly getDeviceInfo: () => Promise<import('./types/index.js').DeviceInfo>
  readonly dispose: () => Promise<void>
}

type KindleSDKServices =
  | WifiTransport
  | ResourceThrottler
  | CommandExecutor
  | DeviceAvailability
  | CommandQueue
  | FileTransfer
  | PowerManager
  | DeviceInfo
  | Library
  | Screenshot
  | WallpaperManager
  | FontManager

class KindleSDKImpl implements KindleSDK {
  constructor(private readonly runtime: ManagedRuntime.ManagedRuntime<KindleSDKServices, never>) {}

  isAvailable() {
    return this.runtime.runPromise(DeviceAvailability.use((s) => s.isAvailable))
  }

  waitForAvailable() {
    return this.runtime.runPromise(DeviceAvailability.use((s) => s.waitForAvailable))
  }

  lockScreen() {
    return this.runtime.runPromise(PowerManager.use((s) => s.lockScreen()))
  }

  takeScreenshot(localPath?: string) {
    return this.runtime.runPromise(Screenshot.use((s) => s.takeScreenshot(localPath)))
  }

  listBooks() {
    return this.runtime.runPromise(Library.use((s) => s.listBooks()))
  }

  addBook(localPath: string, fileName: string) {
    return this.runtime.runPromise(Library.use((s) => s.addBook(localPath, fileName)))
  }

  removeBook(fileName: string) {
    return this.runtime.runPromise(Library.use((s) => s.removeBook(fileName)))
  }

  restoreBook(fileName: string) {
    return this.runtime.runPromise(Library.use((s) => s.restoreBook(fileName)))
  }

  refreshLibrary() {
    return this.runtime.runPromise(Library.use((s) => s.refreshLibrary()))
  }

  applyWallpapers(wallpapers: ReadonlyArray<import('./types/index.js').Wallpaper>) {
    return this.runtime.runPromise(WallpaperManager.use((s) => s.applyWallpapers(wallpapers)))
  }

  backupWallpapers() {
    return this.runtime.runPromise(WallpaperManager.use((s) => s.backupWallpapers()))
  }

  restoreWallpapers() {
    return this.runtime.runPromise(WallpaperManager.use((s) => s.restoreWallpapers()))
  }

  listFonts() {
    return this.runtime.runPromise(FontManager.use((s) => s.listFonts()))
  }

  addFont(localPath: string, fileName: string) {
    return this.runtime.runPromise(FontManager.use((s) => s.addFont(localPath, fileName)))
  }

  removeFont(fileName: string) {
    return this.runtime.runPromise(FontManager.use((s) => s.removeFont(fileName)))
  }

  restoreFont(fileName: string) {
    return this.runtime.runPromise(FontManager.use((s) => s.restoreFont(fileName)))
  }

  refreshFontCache() {
    return this.runtime.runPromise(FontManager.use((s) => s.refreshFontCache()))
  }

  getDeviceInfo() {
    return this.runtime.runPromise(DeviceInfo.use((s) => s.getDeviceInfo()))
  }

  dispose() {
    return this.runtime.dispose()
  }
}

const makeLayer = (config: WifiTransportConfig) =>
  Layer.effectContext(
    Effect.gen(function* () {
      const wifi = yield* makeWifiTransport(config)
      const throttler = yield* makeResourceThrottler(config, wifi)
      const commandExecutor = yield* makeCommandExecutor(config, wifi, throttler)
      const deviceAvailability = yield* makeDeviceAvailability(config, wifi)
      const commandQueue = yield* makeCommandQueue(config, commandExecutor, deviceAvailability)
      const fileTransfer = yield* makeFileTransfer(wifi, throttler, config.localCacheDir)
      const powerManager = yield* makePowerManager(commandQueue)
      const deviceInfo = yield* makeDeviceInfo(commandQueue)
      const library = yield* makeLibrary(commandQueue, fileTransfer)
      const screenshot = yield* makeScreenshot(commandQueue, fileTransfer, config.localCacheDir)
      const wallpaper = yield* makeWallpaperManager(commandQueue, fileTransfer)
      const fontManager = yield* makeFontManager(commandQueue, fileTransfer)

      return Context.make(WifiTransport, wifi).pipe(
        Context.add(ResourceThrottler, throttler),
        Context.add(CommandExecutor, commandExecutor),
        Context.add(DeviceAvailability, deviceAvailability),
        Context.add(CommandQueue, commandQueue),
        Context.add(FileTransfer, fileTransfer),
        Context.add(PowerManager, powerManager),
        Context.add(DeviceInfo, deviceInfo),
        Context.add(Library, library),
        Context.add(Screenshot, screenshot),
        Context.add(WallpaperManager, wallpaper),
        Context.add(FontManager, fontManager)
      )
    })
  )

export const createKindleSDK = (
  options: KindleConnectionOptions,
  configOverrides?: Partial<Omit<WifiTransportConfig, keyof KindleConnectionOptions>>
): Effect.Effect<KindleSDK, never, never> =>
  Effect.gen(function* () {
    const config = defaultWifiTransportConfig({ ...options, ...configOverrides })
    const runtime = ManagedRuntime.make(makeLayer(config))
    yield* Effect.promise(() => runtime.context())
    return new KindleSDKImpl(runtime)
  })

export const createKindleSDKPromise = async (
  options: KindleConnectionOptions,
  configOverrides?: Partial<Omit<WifiTransportConfig, keyof KindleConnectionOptions>>
): Promise<KindleSDK> =>
  Effect.runPromise(createKindleSDK(options, configOverrides))
