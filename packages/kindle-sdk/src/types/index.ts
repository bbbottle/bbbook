import type { KindleConnectionOptions as SharedKindleConnectionOptions } from '@bbbook/shared-types'

export type KindleConnectionOptions = SharedKindleConnectionOptions

export class KindleTimeoutError {
  readonly _tag = 'KindleTimeoutError' as const
  constructor(
    readonly command: string,
    readonly cause?: unknown
  ) {}
}

export class KindleDeviceBusyError {
  readonly _tag = 'KindleDeviceBusyError' as const
  constructor(readonly message: string) {}
}

export class KindlePermissionError {
  readonly _tag = 'KindlePermissionError' as const
  constructor(readonly message: string) {}
}

export type KindleError = KindleTimeoutError | KindleDeviceBusyError | KindlePermissionError
