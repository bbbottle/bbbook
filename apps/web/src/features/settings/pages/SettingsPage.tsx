import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@bbbook/kindle-ui/components/Icon'
import { List } from '@bbbook/kindle-ui/components/List'
import { ListItem, ListItemIcon } from '@bbbook/kindle-ui/components/ListItem'
import { Section } from '@bbbook/kindle-ui/components/Section'

export interface SettingsPageProps {
  role?: 'admin' | 'user'
}

export function SettingsPage({ role }: SettingsPageProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Section className="flex flex-col py-4">
      <List>
        <ListItem
          title={t('settings.deviceInfo')}
          subtitle={t('settings.deviceInfoDesc')}
          onClick={() => navigate('device')}
          meta={<Icon name="chevron-right" size={16} />}
        >
          <ListItemIcon>
            <Icon name="device" size={20} />
          </ListItemIcon>
        </ListItem>
        <ListItem
          title={t('settings.language')}
          subtitle={t('settings.languageDesc')}
          onClick={() => navigate('language')}
          meta={<Icon name="chevron-right" size={16} />}
        >
          <ListItemIcon>
            <Icon name="language" size={20} />
          </ListItemIcon>
        </ListItem>
        {role === 'admin' ? (
          <ListItem
            title={t('settings.userManagement')}
            subtitle={t('settings.userManagementDesc')}
            onClick={() => navigate('users')}
            meta={<Icon name="chevron-right" size={16} />}
          >
            <ListItemIcon>
              <Icon name="account" size={20} />
            </ListItemIcon>
          </ListItem>
        ) : null}
      </List>
    </Section>
  )
}
