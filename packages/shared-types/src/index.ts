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
