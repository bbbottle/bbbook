export type AuthStage =
  | 'login'
  | 'verify'
  | 'setup'
  | 'confirm'
  | 'backup'
  | 'authed'

export interface AuthFlowState {
  stage: AuthStage
  tempToken: string
  secret: string
  uri: string
  qrCodeDataUrl: string
  backupCodes: string[]
  loading: boolean
}

export type AuthFlowAction =
  | { type: 'SUBMIT' }
  | { type: 'ERROR' }
  | { type: 'LOGIN_OK'; stage: 'setup' | 'verify'; tempToken: string }
  | { type: 'SETUP_OK'; secret: string; uri: string; qrCodeDataUrl: string }
  | { type: 'CONFIRM_OK'; backupCodes: string[] }
  | { type: 'SESSION_OK' }
  | { type: 'USE_BACKUP' }
  | { type: 'RESET' }

export const initialAuthFlowState: AuthFlowState = {
  stage: 'login',
  tempToken: '',
  secret: '',
  uri: '',
  qrCodeDataUrl: '',
  backupCodes: [],
  loading: false,
}

export function authFlowReducer(
  state: AuthFlowState,
  action: AuthFlowAction
): AuthFlowState {
  switch (action.type) {
    case 'SUBMIT':
      return { ...state, loading: true }
    case 'ERROR':
      return { ...state, loading: false }
    case 'LOGIN_OK':
      return {
        ...state,
        stage: action.stage,
        tempToken: action.tempToken,
        loading: action.stage === 'setup',
      }
    case 'SETUP_OK':
      return {
        ...state,
        stage: 'setup',
        secret: action.secret,
        uri: action.uri,
        qrCodeDataUrl: action.qrCodeDataUrl,
        loading: false,
      }
    case 'CONFIRM_OK':
      return {
        ...state,
        stage: 'confirm',
        backupCodes: action.backupCodes,
        loading: false,
      }
    case 'SESSION_OK':
      return { ...state, stage: 'authed', loading: false }
    case 'USE_BACKUP':
      return { ...state, stage: 'backup' }
    case 'RESET':
      return initialAuthFlowState
  }
}
