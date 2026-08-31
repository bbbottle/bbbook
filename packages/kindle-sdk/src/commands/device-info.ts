import { shellQuote } from './utils.js'

export const getFirmwareVersion = () =>
  `cat '/etc/kindle/FIRMWARE_VERSION' 2>/dev/null || echo unknown`

export const getModel = () =>
  `cat '/etc/kindle/MODEL' 2>/dev/null || echo unknown`

export const getSerial = () =>
  `cat '/proc/usid' 2>/dev/null || echo unknown`

export const getUptime = () =>
  `awk '{print $1}' /proc/uptime 2>/dev/null || echo 0`

export const getFreeMemory = () =>
  `free -m | awk 'NR==2{print $7}'`

export const getFreeStorage = (path = '/mnt/us') =>
  `df -m ${shellQuote(path)} | awk 'NR==2{print $4}'`
