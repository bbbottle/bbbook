import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster, toast } from 'sonner'
import { type LocalePreference } from '@bbbook/shared-types'
import {
  ActionBar,
  ActionBarMenu,
  ActionBarSpace,
  ActionGroup,
  ActionItem,
  Button,
  Card,
  CardContent,
  CardTitle,
  Dialog,
  Icon,
  Input,
  List,
  ListItem,
  Navbar,
  SearchBar,
  Section,
  StatuBar,
  Typography,
  type MenuItemProps,
} from '@bbbook/kindle-ui'
import { useCached } from '../lib/useCached.js'
import { createUser, listUsers, type User } from '../api/admin.js'
import {
  deleteBook,
  fetchBooks,
  fetchDeviceInfo,
  openBook,
  type Book,
  type BooksResponse,
  type DeviceInfo,
  uploadBook,
} from '../api/kindle.js'
import { type CurrentUser, updateUserPreference } from '../api/auth.js'
import { getLocalePreference, setLocalePreference } from '../i18n/localePreference.js'
import { LocaleOptions } from '../i18n/systemLocale.js'

const ALLOWED_EXTENSIONS = ['azw', 'azw3', 'mobi', 'epub', 'pdf']

function formatError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as { code?: string }).code === 'string') {
    return (err as { code: string }).code
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'UNKNOWN_ERROR'
}

function LanguageCard() {
  const { t } = useTranslation()
  const [preference, setPreference] = useState<LocalePreference>(() => getLocalePreference())
  const latestRef = useRef(preference)
  const savingRef = useRef(false)

  const syncBackend = async () => {
    if (savingRef.current) return
    savingRef.current = true
    try {
      while (true) {
        const value = latestRef.current
        try {
          await updateUserPreference({ locale: value })
        } catch {
          // ignore backend sync failures; local preference already applied
        }
        if (latestRef.current === value) break
      }
    } finally {
      savingRef.current = false
    }
  }

  const handleChange = (value: LocalePreference) => {
    setLocalePreference(value)
    setPreference(value)
    latestRef.current = value
    syncBackend()
  }

  return (
    <Card>
      <CardTitle>{t('settings.language')}</CardTitle>
      <CardContent className="flex flex-col gap-2">
        {LocaleOptions.map((option) => (
          <Button
            key={option.value}
            variant={preference === option.value ? 'default' : 'outline'}
            onClick={() => handleChange(option.value)}
          >
            {t(option.labelKey)}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

interface LayoutProps {
  onLogout?: () => void
  onLock?: () => void
}

function Layout({ onLogout, onLock }: LayoutProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const mainRef = useRef<HTMLElement>(null)
  const [query, setQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const { data: info, revalidate } = useCached<DeviceInfo>({
    key: 'device-info',
    fn: fetchDeviceInfo,
    ttl: 0,
  })

  const localizedMessage = (code: string | null) =>
    code ? t(`errors.${code}`, { defaultValue: code }) : null

  useEffect(() => {
    const id = setInterval(revalidate, 60000)
    return () => clearInterval(id)
  }, [revalidate])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || uploading) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(localizedMessage('INVALID_REQUEST_BODY') ?? t('library.uploadFailed'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    const toastId = toast.loading(t('library.uploading'))
    try {
      await uploadBook(file, (progress, status) => {
        const message =
          status === 'processing'
            ? t('library.processing')
            : `${t('library.uploading')} ${progress}%`
        toast.loading(message, { id: toastId })
      })
      toast.success(t('library.uploadDone'), { id: toastId })
      window.dispatchEvent(new CustomEvent('bbbook:refreshLibrary'))
    } catch (err) {
      const code = formatError(err)
      toast.error(localizedMessage(code) ?? t('library.uploadFailed'), { id: toastId })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const menuItems: MenuItemProps[] = [
    {
      textPrimary: t('library.upload'),
      onClick: () => {
        fileInputRef.current?.click()
      },
    },
    { textPrimary: t('menu.lock'), onClick: onLock },
    { textPrimary: t('menu.logout'), onClick: onLogout },
  ]

  return (
    <div className="flex h-full flex-col">
      <Navbar fixed>
        <StatuBar
          deviceName={(info?.modelName && info.modelName.toLowerCase() !== 'unknown') ? info.modelName : 'bbbook'}
          battery={info?.batteryLevel}
          charging={info?.isCharging}
          celluar={info?.wifi ? { on: true, label: info.wifi.ssid, signal: info.wifi.signal } : undefined}
        />
        <ActionBar>
          <ActionGroup>
            <ActionItem icon={<Icon name="home" size={22} />} onClick={() => navigate('/library')}>
              {t('nav.library')}
            </ActionItem>
            <ActionItem icon={<Icon name="settings" size={22} />} onClick={() => navigate('/settings')}>
              {t('nav.settings')}
            </ActionItem>
          </ActionGroup>
          <ActionBarSpace />
          <ActionGroup>
            <SearchBar value={query} onChange={setQuery} placeholder={t('common.search')} />
            <ActionBarMenu items={menuItems} />
          </ActionGroup>
        </ActionBar>
      </Navbar>
      <main ref={mainRef} className="flex-1 overflow-auto">
        <Outlet context={{ query, setQuery, mainRef }} />
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
        className="hidden"
        onChange={handleFileChange}
      />

      <Toaster position="bottom-right" className="!z-40" toastOptions={{ className: '!rounded-none !border-ink' }} />
    </div>
  )
}

function LibraryPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { query, mainRef } = useOutletContext<{ query: string; mainRef: RefObject<HTMLElement | null> }>()
  const { data, error, loading, refresh } = useCached<BooksResponse>({ key: 'kindle-books', fn: fetchBooks, ttl: 0 })
  const pullRef = useRef<HTMLDivElement>(null)
  const pullWillRefreshRef = useRef(false)
  const [pullWillRefresh, setPullWillRefresh] = useState(false)

  const PULL_THRESHOLD = 80
  const PULL_MAX = 120

  const localizedMessage = (code: string | null) =>
    code ? t(`errors.${code}`, { defaultValue: code }) : null

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener('bbbook:refreshLibrary', handler)
    return () => window.removeEventListener('bbbook:refreshLibrary', handler)
  }, [refresh])

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    let startY = 0
    let isPulling = false
    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop === 0) {
        startY = e.touches[0].clientY
        isPulling = true
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!isPulling) return
      if (el.scrollTop > 0) {
        isPulling = false
        if (pullRef.current) pullRef.current.style.height = '0px'
        if (pullWillRefreshRef.current) {
          pullWillRefreshRef.current = false
          setPullWillRefresh(false)
        }
        return
      }
      const delta = e.touches[0].clientY - startY
      if (delta > 0) {
        e.preventDefault()
      }
      const dist = Math.min(Math.max(delta, 0) * 0.5, PULL_MAX)
      if (pullRef.current) pullRef.current.style.height = `${dist}px`
      const shouldRefresh = dist > PULL_THRESHOLD
      if (shouldRefresh !== pullWillRefreshRef.current) {
        pullWillRefreshRef.current = shouldRefresh
        setPullWillRefresh(shouldRefresh)
      }
    }
    const onTouchEnd = () => {
      if (!isPulling) return
      isPulling = false
      if (pullRef.current) pullRef.current.style.height = '0px'
      if (pullWillRefreshRef.current) {
        pullWillRefreshRef.current = false
        setPullWillRefresh(false)
        refresh()
      }
    }
    const onTouchCancel = () => {
      if (!isPulling) return
      isPulling = false
      if (pullRef.current) pullRef.current.style.height = '0px'
      if (pullWillRefreshRef.current) {
        pullWillRefreshRef.current = false
        setPullWillRefresh(false)
      }
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchCancel)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [mainRef, refresh])

  const books = data?.books ? [...data.books] : []
  const filtered = query.trim()
    ? books.filter((book) =>
        (book.title || book.fileName).toLowerCase().includes(query.toLowerCase())
      )
    : books

  return (
    <Section className="flex flex-col">
      <div
        ref={pullRef}
        className="flex items-end justify-center overflow-hidden text-center text-sm text-muted transition-none"
        style={{ height: 0 }}
      >
        <span className="pb-2">
          {pullWillRefresh ? t('library.releaseToRefresh') : t('library.pullToRefresh')}
        </span>
      </div>

      {loading && (
        <Typography className="px-4 py-6 text-sm text-muted">{t('common.loading')}</Typography>
      )}
      {error ? (
        <Typography className="px-4 py-6 text-sm text-muted">
          {localizedMessage(formatError(error))}
        </Typography>
      ) : null}
      {!loading && !error && filtered.length === 0 && (
        <Typography className="px-4 py-6 text-sm text-muted">
          {query ? t('library.noSearchResults') : t('library.empty')}
        </Typography>
      )}

      <List className="flex-1">
        {filtered.map((book) => (
          <ListItem
            key={book.id}
            title={book.title || book.fileName}
            subtitle={book.author || book.fileName}
            onClick={() => navigate(`/books/${encodeURIComponent(book.id)}`, { state: book })}
          />
        ))}
      </List>
    </Section>
  )
}

function BookPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const locationState = useLocation().state as Book | undefined
  const { data, refresh } = useCached<BooksResponse>({ key: 'kindle-books', fn: fetchBooks, ttl: 0 })
  const [deleting, setDeleting] = useState(false)

  const localizedMessage = (code: string | null) =>
    code ? t(`errors.${code}`, { defaultValue: code }) : null

  const book = locationState ?? data?.books.find((b) => b.id === id)

  const handleOpen = async () => {
    if (!book) return
    await openBook(book.fileName)
  }

  const handleDelete = () => {
    if (!book || deleting) return
    const confirmId = toast(t('library.deleteConfirm', { fileName: book.fileName }), {
      duration: Infinity,
      action: {
        label: t('common.confirm'),
        onClick: () => {
          toast.dismiss(confirmId)
          performDelete()
        },
      },
      cancel: {
        label: t('common.cancel'),
        onClick: () => toast.dismiss(confirmId),
      },
    })
  }

  const performDelete = async () => {
    if (!book) return
    setDeleting(true)
    const id = toast.loading(t('library.deleting'))
    try {
      await deleteBook(book.fileName)
      await refresh()
      navigate('/library')
      toast.success(t('library.deleteDone'), { id })
    } catch (err) {
      toast.error(localizedMessage(formatError(err)) ?? t('library.deleteFailed'), { id })
    } finally {
      setDeleting(false)
    }
  }

  if (!book) {
    return (
      <Section className="p-4">
        <Typography className="text-sm text-muted">{t('library.bookNotFound')}</Typography>
        <Button className="mt-4" onClick={() => navigate('/library')}>
          {t('common.back')}
        </Button>
      </Section>
    )
  }

  return (
    <Section className="flex flex-col gap-4 p-4">
      <Card>
        <CardTitle>{book.title || book.fileName}</CardTitle>
        <CardContent>
          <Typography className="text-sm text-muted">
            {t('library.fileName')}: {book.fileName}
          </Typography>
          {book.author && (
            <Typography className="text-sm text-muted">
              {t('library.author')}: {book.author}
            </Typography>
          )}
          {book.path && (
            <Typography className="text-sm text-muted">{book.path}</Typography>
          )}
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button onClick={handleOpen}>{t('library.open')}</Button>
        <Button variant="outline" disabled={deleting} onClick={handleDelete}>
          {t('library.delete')}
        </Button>
      </div>

    </Section>
  )
}

interface SettingsPageProps {
  role?: 'admin' | 'user'
}

function SettingsPage({ role }: SettingsPageProps) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [adminMessage, setAdminMessage] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const { data: info, error: infoError } = useCached<DeviceInfo>({
    key: 'kindle-info',
    fn: fetchDeviceInfo,
    ttl: 0,
  })
  const { data: usersData, error: usersError, refresh: refreshUsers } = useCached<User[]>({
    key: role === 'admin' ? 'admin-users' : null,
    fn: listUsers,
    ttl: 0,
  })
  const users = usersData ?? []
  const deviceError = infoError ? formatError(infoError) : null

  const localizedMessage = (code: string | null) =>
    code ? t(`errors.${code}`, { defaultValue: code }) : null

  useEffect(() => {
    if (usersError) {
      setAdminMessage(formatError(usersError))
    }
  }, [usersError])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setAdminMessage(null)
    try {
      await createUser({ username: newUsername, password: newPassword, role: 'user' })
      setAdminMessage(t('settings.newUserTotpNotice'))
      setNewUsername('')
      setNewPassword('')
      setDialogOpen(false)
      refreshUsers()
    } catch (err: unknown) {
      setAdminMessage(localizedMessage(formatError(err)) ?? t('settings.createUserFailed'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <Section className="flex flex-col gap-4 p-4">
      <Card>
        <CardTitle>{t('settings.deviceInfo')}</CardTitle>
        <CardContent>
          {info ? (
            <dl className="grid min-w-0 grid-cols-2 gap-2 text-sm font-sans text-ink [&>*]:min-w-0">
              <dt className="text-muted">{t('settings.serial')}</dt>
              <dd className="truncate" title={info.serialNumber}>{info.serialNumber}</dd>
              <dt className="text-muted">{t('settings.freeMemory')}</dt>
              <dd>{info.freeMemoryMb} MB</dd>
              <dt className="text-muted">{t('settings.freeStorage')}</dt>
              <dd>{info.freeStorageMb} MB</dd>
              <dt className="text-muted">{t('settings.uptime')}</dt>
              <dd>{info.uptimeSeconds}s</dd>
            </dl>
          ) : deviceError ? (
            <Typography className="text-sm text-muted">{localizedMessage(deviceError)}</Typography>
          ) : (
            <Typography className="text-sm text-muted">{t('settings.loadingDeviceInfo')}</Typography>
          )}
        </CardContent>
      </Card>

      {role === 'admin' && (
        <Card>
          <CardTitle>{t('settings.userManagement')}</CardTitle>
          <CardContent className="flex flex-col gap-3">
            <List>
              {users.map((user) => (
                <ListItem
                  key={user.id}
                  title={user.username}
                  subtitle={user.totpEnabled ? t('settings.totpEnabled') : t('settings.totpNotConfigured')}
                  meta={user.role === 'admin' ? t('common.roleAdmin') : t('common.roleUser')}
                />
              ))}
            </List>
            <Button onClick={() => setDialogOpen(true)}>{t('settings.addUser')}</Button>
            {adminMessage ? (
              <Typography className="text-sm text-muted">{adminMessage}</Typography>
            ) : null}
          </CardContent>
        </Card>
      )}

      {dialogOpen && (
        <Dialog
          open
          onClose={() => setDialogOpen(false)}
          title={t('settings.addUser')}
          actions={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={() => formRef.current?.requestSubmit()} disabled={creating}>
                {t('common.add')}
              </Button>
            </>
          }
        >
          <form ref={formRef} onSubmit={handleCreateUser} className="flex flex-col gap-3">
            <Input
              placeholder={t('settings.username')}
              value={newUsername}
              onChange={setNewUsername}
              autoFocus
            />
            <Input
              type="password"
              placeholder={t('settings.initialPassword')}
              value={newPassword}
              onChange={setNewPassword}
            />
          </form>
        </Dialog>
      )}

      <LanguageCard />
    </Section>
  )
}

export interface AppRouterProps {
  onLogout?: () => void
  onLock?: () => void
  currentUser?: CurrentUser | null
}

export function AppRouter({ onLogout, onLock, currentUser }: AppRouterProps) {
  return (
    <MemoryRouter initialEntries={['/library']}>
      <Routes>
        <Route path="/" element={<Layout onLogout={onLogout} onLock={onLock} />}>
          <Route index element={<Navigate to="/library" replace />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="settings" element={<SettingsPage role={currentUser?.role} />} />
          <Route path="books/:id" element={<BookPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}
