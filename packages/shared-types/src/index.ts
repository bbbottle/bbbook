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
