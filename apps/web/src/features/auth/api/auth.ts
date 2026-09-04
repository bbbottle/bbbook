import { type LocalePreference } from '@bbbook/shared-types'
import { get, post, put } from '../../../shared/api/client.js'

export interface LoginRequest {
  username: string
  password?: string
  token?: string
}

export interface LoginResponse {
  stage: 'setup' | 'verify' | 'authed'
  tempToken?: string
  sessionToken?: string
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

export interface CurrentUser {
  id: string
  username: string
  role: 'admin' | 'user'
}

export interface UserPreference {
  locale: LocalePreference
}

export function fetchCurrentUser(): Promise<CurrentUser> {
  return get('/auth/me')
}

export function fetchUserPreference(): Promise<UserPreference> {
  return get('/auth/me/preferences')
}

export function updateUserPreference(request: UserPreference): Promise<void> {
  return put('/auth/me/preferences', request)
}

export function login(request: LoginRequest): Promise<LoginResponse> {
  return post('/auth/login', request)
}

export function totpSetup(
  request: TotpSetupRequest
): Promise<TotpSetupResponse> {
  return post('/auth/totp/setup', request)
}

export function totpConfirm(
  request: TotpConfirmRequest
): Promise<TotpConfirmResponse> {
  return post('/auth/totp/confirm', request)
}

export function totpVerify(
  request: TotpVerifyRequest
): Promise<TotpVerifyResponse> {
  return post('/auth/totp/verify', request)
}

export function backupCode(
  request: BackupCodeRequest
): Promise<BackupCodeResponse> {
  return post('/auth/backup-code', request)
}
