import { Suspense, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate } from 'react-router-dom'
import {
  ActionBar,
  ActionBarSpace,
  ActionGroup,
  ActionItem,
  SearchBar,
} from '@bbbook/kindle-ui/components/ActionBar'
import { ActionBarMenu } from '@bbbook/kindle-ui/components/ActionBarMenu'
import type { MenuItemProps } from '@bbbook/kindle-ui/components/Menu'
import { Icon } from '@bbbook/kindle-ui/components/Icon'
import { Navbar } from '@bbbook/kindle-ui/components/Navbar'
import { StatuBar } from '@bbbook/kindle-ui/components/StatuBar'
import type { DeviceInfo } from '../../features/device/api/device.js'
import { useBookUpload } from '../../features/library/model/useBookUpload.js'
import type { AppOutletContext } from './context.js'

export interface AppLayoutProps {
  onLogout?: () => void
  onLock?: () => void
  info?: DeviceInfo
}

export function AppLayout({ onLogout, onLock, info }: AppLayoutProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const mainRef = useRef<HTMLElement>(null)
  const [query, setQuery] = useState('')
  const upload = useBookUpload()

  const menuItems = useMemo<MenuItemProps[]>(
    () => [
      { textPrimary: t('menu.settings'), onClick: () => navigate('/settings') },
      { textPrimary: t('library.upload'), onClick: upload.openFilePicker },
      { textPrimary: t('menu.lock'), onClick: onLock },
      { textPrimary: t('menu.logout'), onClick: onLogout },
    ],
    [navigate, onLock, onLogout, t, upload.openFilePicker]
  )
  const outletContext = useMemo<AppOutletContext>(
    () => ({ query, setQuery, mainRef }),
    [query]
  )

  return (
    <div className="flex h-full flex-col">
      <Navbar fixed>
        <StatuBar
          deviceName={
            info?.modelName && info.modelName.toLowerCase() !== 'unknown'
              ? info.modelName
              : 'bbbook'
          }
          battery={info?.batteryLevel}
          charging={info?.isCharging}
          celluar={
            info?.wifi
              ? { on: true, label: info.wifi.ssid, signal: info.wifi.signal }
              : undefined
          }
        />
        <ActionBar>
          <ActionGroup>
            <ActionItem
              icon={<Icon name="home" size={22} />}
              onClick={() => navigate('/library')}
            >
              {t('nav.library')}
            </ActionItem>
            <ActionItem
              icon={<Icon name="back" size={18} />}
              onClick={() => navigate(-1)}
            >
              {t('common.back')}
            </ActionItem>
          </ActionGroup>
          <ActionBarSpace />
          <ActionGroup>
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder={t('common.search')}
            />
            <ActionBarMenu items={menuItems} />
          </ActionGroup>
        </ActionBar>
      </Navbar>

      <main ref={mainRef} className="flex-1 overflow-auto">
        <Suspense fallback={null}>
          <Outlet context={outletContext} />
        </Suspense>
      </main>

      <input
        ref={upload.inputRef}
        type="file"
        className="hidden"
        disabled={upload.uploading}
        {...upload.inputProps}
      />
    </div>
  )
}
