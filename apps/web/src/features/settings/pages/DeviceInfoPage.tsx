import { useTranslation } from 'react-i18next'
import { Section } from '@bbbook/kindle-ui/components/Section'
import { Typography } from '@bbbook/kindle-ui/components/Typography'
import { fetchDeviceInfo, type DeviceInfo } from '../../device/api/device.js'
import { DEVICE_INFO_CACHE_KEY } from '../../device/model/device.js'
import { getErrorCode } from '../../../shared/lib/errors.js'
import { useCached } from '../../../shared/lib/useCached.js'

export function DeviceInfoPage() {
  const { t } = useTranslation()
  const { data: info, error } = useCached<DeviceInfo>({
    key: DEVICE_INFO_CACHE_KEY,
    fn: fetchDeviceInfo,
    ttl: 60_000,
  })
  const errorCode = error ? getErrorCode(error) : null

  return (
    <Section className="flex flex-col gap-4 py-4">
      {info ? (
        <dl className="grid min-w-0 grid-cols-2 gap-2 px-4 text-sm font-sans text-ink [&>*]:min-w-0">
          <dt className="text-muted">{t('settings.serial')}</dt>
          <dd className="truncate" title={info.serialNumber}>
            {info.serialNumber}
          </dd>
          <dt className="text-muted">{t('settings.freeMemory')}</dt>
          <dd>{info.freeMemoryMb} MB</dd>
          <dt className="text-muted">{t('settings.freeStorage')}</dt>
          <dd>{info.freeStorageMb} MB</dd>
          <dt className="text-muted">{t('settings.uptime')}</dt>
          <dd>{info.uptimeSeconds}s</dd>
        </dl>
      ) : errorCode ? (
        <Typography className="px-4 text-sm text-muted">
          {t(`errors.${errorCode}`, { defaultValue: errorCode })}
        </Typography>
      ) : (
        <Typography className="px-4 text-sm text-muted">
          {t('settings.loadingDeviceInfo')}
        </Typography>
      )}
    </Section>
  )
}
