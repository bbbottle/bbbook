import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import useSWR from 'swr'
import { Button } from '@bbbook/kindle-ui/components/Button'
import { Dialog } from '@bbbook/kindle-ui/components/Dialog'
import { Input } from '@bbbook/kindle-ui/components/Input'
import { List } from '@bbbook/kindle-ui/components/List'
import { ListItem } from '@bbbook/kindle-ui/components/ListItem'
import { Section } from '@bbbook/kindle-ui/components/Section'
import { getErrorCode } from '../../../shared/lib/errors.js'
import { createUser, deleteUser, listUsers, type User } from '../api/users.js'

const USERS_CACHE_KEY = 'admin-users'

export interface UserManagementPageProps {
  role?: 'admin' | 'user'
  currentUserId?: string
}

export function UserManagementPage({
  role,
  currentUserId,
}: UserManagementPageProps) {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string>()
  const formRef = useRef<HTMLFormElement>(null)
  const { data, mutate } = useSWR<User[]>(
    role === 'admin' ? USERS_CACHE_KEY : null,
    listUsers
  )

  if (role !== 'admin') {
    return null
  }

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault()
    setCreating(true)
    try {
      await createUser({
        username: newUsername,
        password: newPassword,
        role: 'user',
      })
      toast.success(t('settings.newUserTotpNotice'))
      setNewUsername('')
      setNewPassword('')
      setDialogOpen(false)
      void mutate()
    } catch (createError) {
      const code = getErrorCode(createError)
      toast.error(t(`errors.${code}`, { defaultValue: code }))
    } finally {
      setCreating(false)
    }
  }

  const performDeleteUser = async (user: User) => {
    setDeletingUserId(user.id)
    try {
      await deleteUser(user.id)
      await mutate()
      toast.success(t('settings.deleteUserDone'))
    } catch (deleteError) {
      const code = getErrorCode(deleteError)
      toast.error(t(`errors.${code}`, { defaultValue: code }))
    } finally {
      setDeletingUserId(undefined)
    }
  }

  const handleDeleteUser = (user: User) => {
    if (deletingUserId) return
    const confirmId = toast(
      t('settings.deleteUserConfirm', { username: user.username }),
      {
        duration: Infinity,
        action: {
          label: t('common.confirm'),
          onClick: () => {
            toast.dismiss(confirmId)
            void performDeleteUser(user)
          },
        },
        cancel: {
          label: t('common.cancel'),
          onClick: () => toast.dismiss(confirmId),
        },
      }
    )
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
              <div className="flex items-center gap-2">
                <span>
                  {user.role === 'admin'
                    ? t('common.roleAdmin')
                    : t('common.roleUser')}
                </span>
                {user.id !== currentUserId ? (
                  <Button
                    variant="ghost"
                    className="h-8 min-w-0 px-2 text-xs normal-case"
                    disabled={deletingUserId === user.id}
                    onClick={() => handleDeleteUser(user)}
                  >
                    {t('settings.deleteUser')}
                  </Button>
                ) : null}
              </div>
            }
          />
        ))}
      </List>
      <Button className="mx-4" onClick={() => setDialogOpen(true)}>
        {t('settings.addUser')}
      </Button>

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
