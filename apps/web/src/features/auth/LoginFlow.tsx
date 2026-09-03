import { useEffect, useReducer, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@bbbook/kindle-ui/components/Button'
import { Card, CardContent } from '@bbbook/kindle-ui/components/Card'
import { Input, OtpInput } from '@bbbook/kindle-ui/components/Input'
import { Switch } from '@bbbook/kindle-ui/components/Switch'
import { Typography } from '@bbbook/kindle-ui/components/Typography'
import {
  AuthError,
  backupCode,
  login,
  setSessionToken,
  totpConfirm,
  totpSetup,
  totpVerify,
  type LoginResponse,
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

const OTP_REGEX = /^\d{6}$/

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

function localizeError(err: unknown, t: (key: string, options?: { defaultValue?: string }) => string): string {
  if (err instanceof AuthError) {
    return t(`errors.${err.code}`, { defaultValue: err.message })
  }
  if (err instanceof Error) {
    return err.message
  }
  return t('errors.UNKNOWN_ERROR')
}

export function LoginFlow({ onAuthed }: LoginFlowProps) {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(reducer, initialState)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [backupCodeValue, setBackupCodeValue] = useState('')
  const [mode, setMode] = useState<'totp' | 'password'>('totp')

  useEffect(() => {
    if (state.stage === 'authed') {
      onAuthed?.()
    }
  }, [state.stage, onAuthed])

  const startLogin = async () => {
    dispatch({ type: 'SUBMIT' })
    try {
      let response: LoginResponse
      if (mode === 'totp') {
        const token = otp.trim()
        if (!OTP_REGEX.test(token)) {
          throw new Error(t('auth.errorOtpLength'))
        }
        response = await login({ username, token })
      } else {
        if (!password) {
          throw new Error(t('auth.errorPasswordRequired'))
        }
        response = await login({ username, password })
      }
      if (response.stage === 'authed') {
        dispatch({ type: 'SESSION_OK', sessionToken: response.sessionToken! })
      } else {
        dispatch({ type: 'LOGIN_OK', stage: response.stage, tempToken: response.tempToken! })
        if (response.stage === 'setup') {
          const setup = await totpSetup({ tempToken: response.tempToken! })
          dispatch({ type: 'SETUP_OK', ...setup })
        }
      }
    } catch (err) {
      dispatch({ type: 'ERROR', message: localizeError(err, t) })
    }
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    await startLogin()
  }

  const handleContinue = async () => {
    dispatch({ type: 'SUBMIT' })
    try {
      const response = await login({ username, password })
      if (response.stage === 'authed') {
        dispatch({ type: 'SESSION_OK', sessionToken: response.sessionToken! })
      } else {
        dispatch({ type: 'LOGIN_OK', stage: response.stage, tempToken: response.tempToken! })
      }
    } catch (err) {
      dispatch({ type: 'ERROR', message: localizeError(err, t) })
    }
  }

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      dispatch({ type: 'ERROR', message: t('auth.errorOtpLength') })
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
      dispatch({ type: 'ERROR', message: localizeError(err, t) })
    }
  }

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      dispatch({ type: 'ERROR', message: t('auth.errorOtpLength') })
      return
    }
    dispatch({ type: 'SUBMIT' })
    try {
      const response = await totpVerify({ tempToken: state.tempToken, token: otp })
      dispatch({ type: 'SESSION_OK', sessionToken: response.sessionToken })
    } catch (err) {
      dispatch({ type: 'ERROR', message: localizeError(err, t) })
    }
  }

  const handleBackup = async (e: FormEvent) => {
    e.preventDefault()
    if (!backupCodeValue.trim()) {
      dispatch({ type: 'ERROR', message: t('auth.backupCodePlaceholder') })
      return
    }
    dispatch({ type: 'SUBMIT' })
    try {
      const response = await backupCode({ tempToken: state.tempToken, code: backupCodeValue.trim() })
      dispatch({ type: 'SESSION_OK', sessionToken: response.sessionToken })
    } catch (err) {
      dispatch({ type: 'ERROR', message: localizeError(err, t) })
    }
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 transition-opacity duration-[var(--ku-motion-base)]">
      <Card className="w-full max-w-xs border-0">
            <CardContent className="flex flex-col gap-4">
              {state.stage === 'login' && (
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <Input
                    id="username"
                    name="username"
                    autoFocus
                    placeholder={t('auth.usernamePlaceholder')}
                    value={username}
                    onChange={setUsername}
                    disabled={state.loading}
                  />
                  <Input
                    id={mode === 'totp' ? 'otp' : 'password'}
                    name={mode === 'totp' ? 'otp' : 'password'}
                    type={mode === 'totp' ? 'text' : 'password'}
                    placeholder={mode === 'totp' ? t('auth.otpPlaceholder') : t('auth.passwordPlaceholder')}
                    value={mode === 'totp' ? otp : password}
                    onChange={mode === 'totp' ? setOtp : setPassword}
                    disabled={state.loading}
                  />
                  <Button
                    type="submit"
                    disabled={
                      state.loading ||
                      !username ||
                      (mode === 'totp' ? !OTP_REGEX.test(otp.trim()) : !password)
                    }
                  >
                    {state.loading ? '...' : t('auth.verify')}
                  </Button>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-sans text-muted">{t('auth.useOtp')}</span>
                    <Switch
                      checked={mode === 'totp'}
                      onChange={(checked) => {
                        setMode(checked ? 'totp' : 'password')
                        setOtp('')
                        setPassword('')
                      }}
                      ariaLabel={t('auth.useOtp')}
                      disabled={state.loading}
                    />
                  </div>
                </form>
              )}

              {state.stage === 'verify' && (
                <form onSubmit={handleVerify} className="flex flex-col gap-4">
                  <Typography className="text-center text-sm">
                    {t('auth.verifyDescription')}
                  </Typography>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    autoFocus
                    disabled={state.loading}
                    ariaLabel={t('auth.otpAriaLabel')}
                    getDigitAriaLabel={(i, len) => t('auth.otpDigitAriaLabel', { index: i + 1, length: len })}
                  />
                  <Button type="submit" disabled={state.loading || otp.length !== 6}>
                    {t('auth.verify')}
                  </Button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'USE_BACKUP' })}
                    className="self-center text-sm font-sans text-muted hover:text-ink focus-visible:ku-focus-ring"
                  >
                    {t('auth.useBackupCode')}
                  </button>
                </form>
              )}

              {state.stage === 'backup' && (
                <form onSubmit={handleBackup} className="flex flex-col gap-4">
                  <Typography className="text-center text-sm">
                    {t('auth.backupCodeDescription')}
                  </Typography>
                  <Input
                    autoFocus
                    value={backupCodeValue}
                    onChange={setBackupCodeValue}
                    disabled={state.loading}
                    placeholder={t('auth.backupCodePlaceholder')}
                  />
                  <Button type="submit" disabled={state.loading || !backupCodeValue.trim()}>
                    {t('auth.signIn')}
                  </Button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'RESET' })}
                    className="self-center text-sm font-sans text-muted hover:text-ink focus-visible:ku-focus-ring"
                  >
                    {t('auth.backToSignIn')}
                  </button>
                </form>
              )}

              {state.stage === 'setup' && (
                <form onSubmit={handleConfirm} className="flex flex-col gap-4">
                  {!state.secret ? (
                    <>
                      <Typography className="text-center text-sm">
                        {state.loading ? t('auth.preparingTwoFactor') : t('auth.twoFactorLoadFailed')}
                      </Typography>
                      {!state.loading && (
                        <Button type="button" onClick={startLogin}>
                          {t('common.tryAgain')}
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography className="text-center text-sm">
                        {t('auth.scanQrDescription')}
                      </Typography>
                      {state.qrCodeDataUrl ? (
                        <img
                          src={state.qrCodeDataUrl}
                          alt={t('auth.qrCodeAlt')}
                          className="mx-auto aspect-square w-40 rounded-md border border-divider bg-paper p-2"
                        />
                      ) : null}
                      {state.secret ? (
                        <Input
                          id="totp-secret"
                          value={state.secret}
                          readOnly
                          className="text-center text-xs"
                        />
                      ) : null}
                      <OtpInput
                    value={otp}
                    onChange={setOtp}
                    autoFocus
                    disabled={state.loading}
                    ariaLabel={t('auth.otpAriaLabel')}
                    getDigitAriaLabel={(i, len) => t('auth.otpDigitAriaLabel', { index: i + 1, length: len })}
                  />
                      <Button type="submit" disabled={state.loading || otp.length !== 6}>
                        {t('common.confirm')}
                      </Button>
                    </>
                  )}
                </form>
              )}

              {state.stage === 'confirm' && (
                <div className="flex flex-col gap-4">
                  <Typography className="text-sm">
                    {t('auth.setupComplete')}
                  </Typography>
                  <ul className="grid grid-cols-2 gap-2 font-mono text-xs text-ink">
                    {state.backupCodes.map((code) => (
                      <li key={code} className="rounded-sm border border-divider bg-paper px-2 py-1 text-center">
                        {code}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={handleContinue} disabled={state.loading}>
                    {t('auth.continueToSignIn')}
                  </Button>
                </div>
              )}

              {state.stage === 'authed' && (
                <Typography className="text-center">{t('auth.signedIn')}</Typography>
              )}

              {state.error ? (
                <p className="text-center text-sm font-sans text-ink" role="alert">
                  {state.error}
                </p>
              ) : null}
            </CardContent>
          </Card>
    </div>
  )
}
