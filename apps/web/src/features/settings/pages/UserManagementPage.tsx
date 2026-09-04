import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import useSWR from 'swr'
import { Button } from '@bbbook/kindle-ui/components/Button'
import { Dialog } from '@bbbook/kindle-ui/components/Dialog'
import { Input } from '@bbbook/kindle-ui/components/Input'
import { List } from '@bbbook/kindle-ui/components/List'
import { ListItem } from '@bbbook/kindle-ui/components/ListItem'
import { Section } from '@bbbook/kindle-ui/components/Section'
import { Typography } from '@bbbook/kindle-ui/components/Typography'
import { getErrorCode } from '../../../shared/lib/errors.js'
import { createUser, listUsers, type User } from '../api/users.js'

const USERS_CACHE_KEY = 'admin-users'

export interface UserManagementPageProps {
  role?: 'admin' | 'user'
}

export function UserManagementPage({ role }: UserManagementPageProps) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const { data, error, mutate } = useSWR<User[]>(
    role === 'admin' ? USERS_CACHE_KEY : null,
    listUsers
  )

  if (role !== 'admin') {
    return (
      <Section className="flex flex-col gap-4 py-4">
        <Typography className="px-4 text-sm text-muted">
          {t('errors.FORBIDDEN')}
        </Typography>
      </Section>
    )
  }

  const errorMessage = error
    ? t(`errors.${getErrorCode(error)}`, {
        defaultValue: getErrorCode(error),
      })
    : null

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault()
    setCreating(true)
    setActionMessage(null)
    try {
      await createUser({
        username: newUsername,
        password: newPassword,
        role: 'user',
      })
      setActionMessage(t('settings.newUserTotpNotice'))
      setNewUsername('')
      setNewPassword('')
      setDialogOpen(false)
      void mutate()
    } catch (createError) {
      const code = getErrorCode(createError)
      setActionMessage(t(`errors.${code}`, { defaultValue: code }))
    } finally {
      setCreating(false)
    }
  }

  return (
    <Section className="flex flex-col gap-4 py-4">
      <List>
        {(data ?? []).map((user) => (
          <ListItem
            key={user.id}
            className="[content-visibility:auto] [contain-intrinsic-size:auto_56px]"
            title={user.username}
            subtitle={
              user.totpEnabled
                ? t('settings.totpEnabled')
                : t('settings.totpNotConfigured')
            }
            meta={
              user.role === 'admin'
                ? t('common.roleAdmin')
                : t('common.roleUser')
            }
          />
        ))}
      </List>
      <Button className="mx-4" onClick={() => setDialogOpen(true)}>
        {t('settings.addUser')}
      </Button>
      {actionMessage || errorMessage ? (
        <Typography className="px-4 text-sm text-muted">
          {actionMessage ?? errorMessage}
        </Typography>
      ) : null}

      {dialogOpen ? (
        <Dialog
          open
          onClose={() => setDialogOpen(false)}
          title={t('settings.addUser')}
          actions={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={() => formRef.current?.requestSubmit()}
                disabled={creating}
              >
                {t('common.add')}
              </Button>
            </>
          }
        >
          <form
            ref={formRef}
            onSubmit={handleCreateUser}
            className="flex flex-col gap-3"
          >
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
      ) : null}
    </Section>
  )
}
