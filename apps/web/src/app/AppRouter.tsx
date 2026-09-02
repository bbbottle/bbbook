import { useEffect, useState } from 'react'
import {
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  ActionBar,
  ActionBarMenu,
  ActionBarSpace,
  ActionGroup,
  ActionItem,
  Card,
  CardContent,
  CardTitle,
  Grid,
  GridItem,
  Icon,
  List,
  ListItem,
  Navbar,
  SearchBar,
  Section,
  SectionTitle,
  StatuBar,
  Switch,
  Tab,
  TabItem,
  Typography,
} from '@bbbook/kindle-ui'
import { fetchDeviceInfo, type DeviceInfo } from '../api/kindle.js'

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

interface LayoutProps {
  onLogout?: () => void
}

function Layout({ onLogout }: LayoutProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const menuItems = [
    { textPrimary: 'Sync' },
    { textPrimary: 'Settings', onClick: () => navigate('/settings') },
    { textPrimary: '登出', onClick: onLogout },
    { textPrimary: 'About' },
  ]

  return (
    <div className="flex h-full flex-col">
      <Navbar fixed>
        <StatuBar
          deviceName="My Kindle"
          battery={86}
          celluar={{ on: true, label: 'LTE', signal: 3 }}
        />
        <ActionBar>
          <ActionGroup>
            <ActionItem icon={<Icon name="home" size={22} />} onClick={() => navigate('/library')}>
              library
            </ActionItem>
            <ActionItem icon={<Icon name="store" size={22} />} onClick={() => navigate('/store')}>
              store
            </ActionItem>
            <ActionItem icon={<Icon name="settings" size={22} />} onClick={() => navigate('/settings')}>
              settings
            </ActionItem>
          </ActionGroup>
          <ActionBarSpace />
          <ActionGroup>
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={(value) => console.log('search', value)}
              placeholder="Search"
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
  const [tab, setTab] = useState('all')

  return (
    <Section className="flex flex-col gap-2">
      <Tab>
        <TabItem active={tab === 'all'} onClick={() => setTab('all')}>All</TabItem>
        <TabItem active={tab === 'downloaded'} onClick={() => setTab('downloaded')}>Downloaded</TabItem>
      </Tab>
      <SectionTitle label="Results" />
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

function SettingsPage() {
  const [airplane, setAirplane] = useState(false)
  const [wifi, setWifi] = useState(false)
  const [info, setInfo] = useState<DeviceInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDeviceInfo()
      .then(setInfo)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <Section className="flex flex-col gap-4 p-4">
      <Card>
        <CardTitle>Device Options</CardTitle>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-sans text-ink">Airplane mode</span>
            <Switch checked={airplane} onChange={setAirplane} ariaLabel="Airplane mode" />
          </div>
          <div className="h-px bg-divider" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-sans text-ink">Wi-Fi</span>
            <Switch checked={wifi} onChange={setWifi} ariaLabel="Wi-Fi" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Device Info</CardTitle>
        <CardContent>
          {info ? (
            <dl className="grid grid-cols-2 gap-2 text-sm font-sans text-ink">
              <dt className="text-muted">Serial</dt>
              <dd>{info.serialNumber}</dd>
              <dt className="text-muted">Free memory</dt>
              <dd>{info.freeMemoryMb} MB</dd>
              <dt className="text-muted">Free storage</dt>
              <dd>{info.freeStorageMb} MB</dd>
              <dt className="text-muted">Uptime</dt>
              <dd>{info.uptimeSeconds}s</dd>
            </dl>
          ) : error ? (
            <Typography className="text-sm text-muted">{error}</Typography>
          ) : (
            <Typography className="text-sm text-muted">Loading device info…</Typography>
          )}
        </CardContent>
      </Card>
    </Section>
  )
}

function BookPage() {
  const params = useParams<{ id: string }>()
  const book = books.find((b) => b.id === params.id)
  return (
    <Section className="p-4">
      <Card>
        <CardTitle>{book?.title ?? 'Book'}</CardTitle>
        <CardContent>
          <Typography className="text-sm text-muted">
            {book ? book.subtitle : `Book ${params.id}`}
          </Typography>
        </CardContent>
      </Card>
    </Section>
  )
}

export interface AppRouterProps {
  onLogout?: () => void
}

export function AppRouter({ onLogout }: AppRouterProps) {
  return (
    <MemoryRouter initialEntries={['/library']}>
      <Routes>
        <Route path="/" element={<Layout onLogout={onLogout} />}>
          <Route index element={<Navigate to="/library" replace />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="store" element={<StorePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="books/:id" element={<BookPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}
