import { useEffect, useReducer, useState, type FormEvent } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardTitle,
  Input,
  OtpInput,
  Typography,
} from '@bbbook/kindle-ui'
import {
  backupCode,
  login,
  setSessionToken,
  totpConfirm,
  totpSetup,
  totpVerify,
} from '../../api/auth.js'

type Stage = 'login' | 'verify' | 'setup' | 'confirm' | 'backup' | 'authed'

interface State {
  stage: Stage
  tempToken: string
  secret: string
  uri: string
  qrCodeDataUrl: string
  backupCodes: string[]
  error: string | null
  loading: boolean
}

type Action =
  | { type: 'SUBMIT' }
  | { type: 'ERROR'; message: string }
  | { type: 'LOGIN_OK'; stage: 'setup' | 'verify'; tempToken: string }
  | { type: 'SETUP_OK'; secret: string; uri: string; qrCodeDataUrl: string }
  | { type: 'CONFIRM_OK'; backupCodes: string[] }
  | { type: 'SESSION_OK'; sessionToken: string }
  | { type: 'USE_BACKUP' }
  | { type: 'RESET' }

const initialState: State = {
  stage: 'login',
  tempToken: '',
  secret: '',
  uri: '',
  qrCodeDataUrl: '',
  backupCodes: [],
  error: null,
  loading: false,
}

function reducer(state: State, action: Action): State {
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
      setSessionToken(action.sessionToken)
      return { ...state, stage: 'authed', loading: false, error: null }
    case 'USE_BACKUP':
      return { ...state, stage: 'backup', error: null }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export interface LoginFlowProps {
  onAuthed?: () => void
}

export function LoginFlow({ onAuthed }: LoginFlowProps) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [backupCodeValue, setBackupCodeValue] = useState('')

  useEffect(() => {
    if (state.stage === 'authed') {
      onAuthed?.()
    }
  }, [state.stage, onAuthed])

  const startLogin = async () => {
    dispatch({ type: 'SUBMIT' })
    try {
      const response = await login({ username, password })
      dispatch({ type: 'LOGIN_OK', stage: response.stage, tempToken: response.tempToken })
      if (response.stage === 'setup') {
        const setup = await totpSetup({ tempToken: response.tempToken })
        dispatch({ type: 'SETUP_OK', ...setup })
      }
    } catch (err) {
      dispatch({ type: 'ERROR', message: (err as Error).message })
    }
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    await startLogin()
  }

  const handleContinue = async () => {
    await startLogin()
  }

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      dispatch({ type: 'ERROR', message: 'Enter the 6-digit code from your authenticator app' })
      return
    }
    dispatch({ type: 'SUBMIT' })
    try {
      const response = await totpConfirm({
        tempToken: state.tempToken,
        secret: state.secret,
        token: otp,
      })
      setOtp('')
      dispatch({ type: 'CONFIRM_OK', backupCodes: response.backupCodes })
    } catch (err) {
      dispatch({ type: 'ERROR', message: (err as Error).message })
    }
  }

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      dispatch({ type: 'ERROR', message: 'Enter the 6-digit code' })
      return
    }
    dispatch({ type: 'SUBMIT' })
    try {
      const response = await totpVerify({ tempToken: state.tempToken, token: otp })
      dispatch({ type: 'SESSION_OK', sessionToken: response.sessionToken })
    } catch (err) {
      dispatch({ type: 'ERROR', message: (err as Error).message })
    }
  }

  const handleBackup = async (e: FormEvent) => {
    e.preventDefault()
    if (!backupCodeValue.trim()) {
      dispatch({ type: 'ERROR', message: 'Enter a backup code' })
      return
    }
    dispatch({ type: 'SUBMIT' })
    try {
      const response = await backupCode({ tempToken: state.tempToken, code: backupCodeValue.trim() })
      dispatch({ type: 'SESSION_OK', sessionToken: response.sessionToken })
    } catch (err) {
      dispatch({ type: 'ERROR', message: (err as Error).message })
    }
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 transition-opacity duration-[var(--ku-motion-base)]">
      <Card className="w-full max-w-xs">
            <CardTitle className="text-center">bbbook</CardTitle>
            <CardContent className="flex flex-col gap-4">
              {state.stage === 'login' && (
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="username" className="text-sm font-sans text-muted">
                      Username
                    </label>
                    <Input
                      id="username"
                      name="username"
                      autoFocus
                      placeholder="username"
                      value={username}
                      onChange={setUsername}
                      disabled={state.loading}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="password" className="text-sm font-sans text-muted">
                      Password
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="password"
                      value={password}
                      onChange={setPassword}
                      disabled={state.loading}
                    />
                  </div>
                  <Button type="submit" disabled={state.loading || !username || !password}>
                    {state.loading ? '...' : 'Sign in'}
                  </Button>
                </form>
              )}

              {state.stage === 'verify' && (
                <form onSubmit={handleVerify} className="flex flex-col gap-4">
                  <Typography className="text-center text-sm">
                    Enter the 6-digit code from your authenticator app
                  </Typography>
                  <OtpInput value={otp} onChange={setOtp} autoFocus disabled={state.loading} />
                  <Button type="submit" disabled={state.loading || otp.length !== 6}>
                    Verify
                  </Button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'USE_BACKUP' })}
                    className="self-center text-sm font-sans text-muted hover:text-ink focus-visible:ku-focus-ring"
                  >
                    Use a backup code
                  </button>
                </form>
              )}

              {state.stage === 'backup' && (
                <form onSubmit={handleBackup} className="flex flex-col gap-4">
                  <Typography className="text-center text-sm">
                    Enter one of your backup codes
                  </Typography>
                  <Input
                    autoFocus
                    value={backupCodeValue}
                    onChange={setBackupCodeValue}
                    disabled={state.loading}
                    placeholder="backup code"
                  />
                  <Button type="submit" disabled={state.loading || !backupCodeValue.trim()}>
                    Sign in
                  </Button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'RESET' })}
                    className="self-center text-sm font-sans text-muted hover:text-ink focus-visible:ku-focus-ring"
                  >
                    Back to sign in
                  </button>
                </form>
              )}

              {state.stage === 'setup' && (
                <form onSubmit={handleConfirm} className="flex flex-col gap-4">
                  {!state.secret ? (
                    <>
                      <Typography className="text-center text-sm">
                        {state.loading ? 'Preparing two-factor setup…' : 'Could not load setup. Please try again.'}
                      </Typography>
                      {!state.loading && (
                        <Button type="button" onClick={startLogin}>
                          Try again
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography className="text-center text-sm">
                        Scan the QR code with your authenticator app, then enter the 6-digit code.
                      </Typography>
                      {state.qrCodeDataUrl && (
                        <img
                          src={state.qrCodeDataUrl}
                          alt="TOTP QR code"
                          className="mx-auto aspect-square w-40 rounded-md border border-divider bg-paper p-2"
                        />
                      )}
                      {state.secret && (
                        <Input
                          id="totp-secret"
                          value={state.secret}
                          readOnly
                          className="text-center text-xs"
                        />
                      )}
                      <OtpInput value={otp} onChange={setOtp} autoFocus disabled={state.loading} />
                      <Button type="submit" disabled={state.loading || otp.length !== 6}>
                        Confirm
                      </Button>
                    </>
                  )}
                </form>
              )}

              {state.stage === 'confirm' && (
                <div className="flex flex-col gap-4">
                  <Typography className="text-sm">
                    Your account is set up. Save these backup codes, then continue to sign in.
                  </Typography>
                  <ul className="grid grid-cols-2 gap-2 font-mono text-xs text-ink">
                    {state.backupCodes.map((code) => (
                      <li key={code} className="rounded-sm border border-divider bg-paper px-2 py-1 text-center">
                        {code}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={handleContinue} disabled={state.loading}>
                    Continue to sign in
                  </Button>
                </div>
              )}

              {state.stage === 'authed' && (
                <Typography className="text-center">Signed in</Typography>
              )}

              {state.error && (
                <p className="text-center text-sm font-sans text-ink" role="alert">
                  {state.error}
                </p>
              )}
            </CardContent>
          </Card>
    </div>
  )
}
