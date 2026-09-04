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
  error: string | null
  loading: boolean
}

export type AuthFlowAction =
  | { type: 'SUBMIT' }
  | { type: 'ERROR'; message: string }
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
  error: null,
  loading: false,
}

export function authFlowReducer(
  state: AuthFlowState,
  action: AuthFlowAction
): AuthFlowState {
  switch (action.type) {
    case 'SUBMIT':
      return { ...state, loading: true, error: null }
    case 'ERROR':
      return { ...state, loading: false, error: action.message }
    case 'LOGIN_OK':
      return {
        ...state,
        stage: action.stage,
        tempToken: action.tempToken,
        loading: action.stage === 'setup',
        error: null,
      }
    case 'SETUP_OK':
      return {
        ...state,
        stage: 'setup',
        secret: action.secret,
        uri: action.uri,
        qrCodeDataUrl: action.qrCodeDataUrl,
        loading: false,
        error: null,
      }
    case 'CONFIRM_OK':
      return {
        ...state,
        stage: 'confirm',
        backupCodes: action.backupCodes,
        loading: false,
        error: null,
      }
    case 'SESSION_OK':
      return { ...state, stage: 'authed', loading: false, error: null }
    case 'USE_BACKUP':
      return { ...state, stage: 'backup', error: null }
    case 'RESET':
      return initialAuthFlowState
  }
}
