import { lazy } from 'react'
import { MemoryRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import type { CurrentUser } from '../features/auth/api/auth.js'
import type { DeviceInfo } from '../features/device/api/device.js'
import { AppLayout } from './layout/AppLayout.js'

const LibraryPage = lazy(() =>
  import('../features/library/pages/LibraryPage.js').then((module) => ({
    default: module.LibraryPage,
  }))
)
const BookPage = lazy(() =>
  import('../features/library/pages/BookPage.js').then((module) => ({
    default: module.BookPage,
  }))
)
const SettingsPage = lazy(() =>
  import('../features/settings/pages/SettingsPage.js').then((module) => ({
    default: module.SettingsPage,
  }))
)
const DeviceInfoPage = lazy(() =>
  import('../features/settings/pages/DeviceInfoPage.js').then((module) => ({
    default: module.DeviceInfoPage,
  }))
)
const LanguagePage = lazy(() =>
  import('../features/settings/pages/LanguagePage.js').then((module) => ({
    default: module.LanguagePage,
  }))
)
const UserManagementPage = lazy(() =>
  import('../features/settings/pages/UserManagementPage.js').then((module) => ({
    default: module.UserManagementPage,
  }))
)

export interface AppRouterProps {
  onLogout?: () => void
  onLock?: () => void
  currentUser?: CurrentUser | null
  deviceInfo?: DeviceInfo
}

export function AppRouter({
  onLogout,
  onLock,
  currentUser,
  deviceInfo,
}: AppRouterProps) {
  const role = currentUser?.role

  return (
    <MemoryRouter initialEntries={['/library']}>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout
              onLogout={onLogout}
              onLock={onLock}
              info={deviceInfo}
            />
          }
        >
          <Route index element={<Navigate to="/library" replace />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="books/:id" element={<BookPage />} />
          <Route path="settings" element={<Outlet />}>
            <Route index element={<SettingsPage role={role} />} />
            <Route path="device" element={<DeviceInfoPage />} />
            <Route path="language" element={<LanguagePage />} />
            <Route
              path="users"
              element={
                <UserManagementPage
                  role={role}
                  currentUserId={currentUser?.id}
                />
              }
            />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>
  )
}
