import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCached } from '../lib/useCached.js'
import {
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { ActionBar, ActionGroup, ActionItem, ActionBarSpace, SearchBar } from '@bbbook/kindle-ui/components/ActionBar'
import { ActionBarMenu } from '@bbbook/kindle-ui/components/ActionBarMenu'
import { Button } from '@bbbook/kindle-ui/components/Button'
import { Card, CardContent, CardTitle } from '@bbbook/kindle-ui/components/Card'
import { Dialog } from '@bbbook/kindle-ui/components/Dialog'
import { Grid, GridItem } from '@bbbook/kindle-ui/components/Grid'
import { Icon } from '@bbbook/kindle-ui/components/Icon'
import { Input } from '@bbbook/kindle-ui/components/Input'
import { List } from '@bbbook/kindle-ui/components/List'
import { ListItem } from '@bbbook/kindle-ui/components/ListItem'
import { Navbar } from '@bbbook/kindle-ui/components/Navbar'
import { Section, SectionTitle } from '@bbbook/kindle-ui/components/Section'
import { StatuBar } from '@bbbook/kindle-ui/components/StatuBar'
import { Switch } from '@bbbook/kindle-ui/components/Switch'
import { Tab, TabItem } from '@bbbook/kindle-ui/components/Tab'
import { Typography } from '@bbbook/kindle-ui/components/Typography'
import { createUser, listUsers, type User } from '../api/admin.js'
import {
  fetchDeviceInfo,
  type DeviceInfo,
} from '../api/kindle.js'
import {
  type CurrentUser,
  updateUserPreference,
} from '../api/auth.js'
import { type LocalePreference } from '@bbbook/shared-types'
import { getLocalePreference, setLocalePreference } from '../i18n/localePreference'
import { LocaleOptions } from '../i18n/systemLocale'

const books = [
  { id: '1', title: 'The Great Gatsby', subtitle: 'F. Scott Fitzgerald', meta: '32%' },
  { id: '2', title: '1984', subtitle: 'George Orwell', meta: 'New' },
  { id: '3', title: 'Moby Dick', subtitle: 'Herman Melville', meta: 'Cloud' },
  { id: '4', title: 'Invisible Man', subtitle: 'Ralph Ellison', meta: '10%' },
  { id: '5', title: 'Dune', subtitle: 'Frank Herbert', meta: 'Cloud' },
]

const storeItems = [
  { id: '1', title: 'Design Patterns', subtitle: 'Gang of Four', meta: 'EPUB' },
  { id: '2', title: 'Clean Code', subtitle: 'Robert C. Martin', meta: 'EPUB' },
  { id: '3', title: 'The Pragmatic Programmer', subtitle: 'Hunt & Thomas', meta: 'PDF' },
]

function formatError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as { code?: string }).code === 'string') {
    return (err as { code: string }).code
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'UNKNOWN_ERROR'
}

interface LayoutProps {
  onLogout?: () => void
}

function Layout({ onLogout }: LayoutProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const menuItems = [
    { textPrimary: t('menu.sync') },
    { textPrimary: t('menu.settings'), onClick: () => navigate('/settings') },
    { textPrimary: t('menu.logout'), onClick: onLogout },
    { textPrimary: t('menu.about') },
  ]

  return (
    <div className="flex h-full flex-col">
      <Navbar fixed>
        <StatuBar
          deviceName={t('common.deviceName')}
          battery={86}
          celluar={{ on: true, label: t('common.networkLabel'), signal: 3 }}
        />
        <ActionBar>
          <ActionGroup>
            <ActionItem icon={<Icon name="home" size={22} />} onClick={() => navigate('/library')}>
              {t('nav.library')}
            </ActionItem>
            <ActionItem icon={<Icon name="store" size={22} />} onClick={() => navigate('/store')}>
              {t('nav.store')}
            </ActionItem>
            <ActionItem icon={<Icon name="settings" size={22} />} onClick={() => navigate('/settings')}>
              {t('nav.settings')}
            </ActionItem>
          </ActionGroup>
          <ActionBarSpace />
          <ActionGroup>
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={(value) => console.log('search', value)}
              placeholder={t('common.search')}
            />
            <ActionBarMenu items={menuItems} />
          </ActionGroup>
        </ActionBar>
      </Navbar>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

function LibraryPage() {
  const [active, setActive] = useState<string | null>(null)
  const navigate = useNavigate()

  return (
    <List className="flex-1">
      {books.map((book) => (
        <ListItem
          key={book.id}
          title={book.title}
          subtitle={book.subtitle}
          meta={book.meta}
          active={active === book.id}
          onClick={() => {
            setActive(book.id)
            navigate(`/books/${book.id}`)
          }}
        />
      ))}
    </List>
  )
}

function StorePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('all')

  return (
    <Section className="flex flex-col gap-2">
      <Tab>
        <TabItem active={tab === 'all'} onClick={() => setTab('all')}>{t('store.tabAll')}</TabItem>
        <TabItem active={tab === 'downloaded'} onClick={() => setTab('downloaded')}>{t('store.tabDownloaded')}</TabItem>
      </Tab>
      <SectionTitle label={t('store.sectionResults')} />
      <Grid dense className="mb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <GridItem key={i} className="bg-muted" />
        ))}
      </Grid>
      <List>
        {storeItems.map((item) => (
          <ListItem key={item.id} title={item.title} subtitle={item.subtitle} meta={item.meta} />
        ))}
      </List>
    </Section>
  )
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

interface SettingsPageProps {
  role?: 'admin' | 'user'
}

function SettingsPage({ role }: SettingsPageProps) {
  const { t } = useTranslation()
  const [airplane, setAirplane] = useState(false)
  const [wifi, setWifi] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [adminMessage, setAdminMessage] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const { data: info, error: infoError } = useCached<DeviceInfo>({
    key: 'device-info',
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

  useEffect(() => {
    if (usersError) {
      setAdminMessage(formatError(usersError))
    }
  }, [usersError])

  const localizedMessage = (code: string | null) => {
    if (!code) return null
    return t(`errors.${code}`, { defaultValue: code })
  }

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
      <LanguageCard />

      <Card>
        <CardTitle>{t('settings.deviceOptions')}</CardTitle>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-sans text-ink">{t('settings.airplaneMode')}</span>
            <Switch checked={airplane} onChange={setAirplane} ariaLabel={t('settings.airplaneMode')} />
          </div>
          <div className="h-px bg-divider" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-sans text-ink">{t('settings.wifi')}</span>
            <Switch checked={wifi} onChange={setWifi} ariaLabel={t('settings.wifi')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardTitle>{t('settings.deviceInfo')}</CardTitle>
        <CardContent>
          {info ? (
            <dl className="grid grid-cols-2 gap-2 text-sm font-sans text-ink">
              <dt className="text-muted">{t('settings.serial')}</dt>
              <dd>{info.serialNumber}</dd>
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
              <Typography className="text-sm text-muted">{localizedMessage(adminMessage) ?? adminMessage}</Typography>
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
    </Section>
  )
}

function BookPage() {
  const { t } = useTranslation()
  const params = useParams<{ id: string }>()
  const book = books.find((b) => b.id === params.id)
  return (
    <Section className="p-4">
      <Card>
        <CardTitle>{book?.title ?? t('common.book')}</CardTitle>
        <CardContent>
          <Typography className="text-sm text-muted">
            {book ? book.subtitle : `${t('common.book')} ${params.id}`}
          </Typography>
        </CardContent>
      </Card>
    </Section>
  )
}

export interface AppRouterProps {
  onLogout?: () => void
  currentUser?: CurrentUser | null
}

export function AppRouter({ onLogout, currentUser }: AppRouterProps) {
  return (
    <MemoryRouter initialEntries={['/library']}>
      <Routes>
        <Route path="/" element={<Layout onLogout={onLogout} />}>
          <Route index element={<Navigate to="/library" replace />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="store" element={<StorePage />} />
          <Route path="settings" element={<SettingsPage role={currentUser?.role} />} />
          <Route path="books/:id" element={<BookPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}
