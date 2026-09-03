export interface User {
  id: string
  email: string
}

export interface Book {
  id: string
  title: string
  author?: string
  path?: string
  coverUrl?: string
  fileName: string
}

export interface KindleDeviceInfo {
  firmwareVersion: string
  modelName: string
  batteryLevel: number
  isCharging: boolean
}

export interface KindleConnectionOptions {
  readonly sshCmdStr: string
  readonly connectionTimeout?: number
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  stage: 'setup' | 'verify'
  tempToken: string
}

export interface TotpSetupRequest {
  tempToken: string
}

export interface TotpSetupResponse {
  secret: string
  uri: string
  qrCodeDataUrl: string
}

export interface TotpConfirmRequest {
  tempToken: string
  secret: string
  token: string
}

export interface TotpConfirmResponse {
  backupCodes: string[]
}

export interface TotpVerifyRequest {
  tempToken: string
  token: string
}

export interface TotpVerifyResponse {
  sessionToken: string
}

export interface BackupCodeRequest {
  tempToken: string
  code: string
}

export interface BackupCodeResponse {
  sessionToken: string
}

export const Locales = ['system', 'zh-CN', 'zh-TW', 'en'] as const
export type LocalePreference = (typeof Locales)[number]

export const ErrorCodes = [
  'INVALID_REQUEST_BODY',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'INVALID_CREDENTIALS',
  'INVALID_OTP',
  'TOTP_NOT_CONFIGURED',
  'TOTP_ALREADY_ENABLED',
  'USER_NOT_FOUND',
  'USERNAME_TAKEN',
  'INVALID_BACKUP_CODE',
  'RATE_LIMITED',
  'QUEUE_FULL',
  'DEVICE_UNAVAILABLE',
  'UNKNOWN_ERROR',
] as const
export type ErrorCode = (typeof ErrorCodes)[number]
