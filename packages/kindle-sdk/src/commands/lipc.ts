import { shellQuote } from './utils.js'

export { shellQuote }

export const setPreventScreenSaver = (prevent: boolean) =>
  `lipc-set-prop com.lab126.powerd preventScreenSaver ${prevent ? 1 : 0}`

export const getBatteryLevel = () => `lipc-get-prop -i com.lab126.powerd battLevel`

export const getBatteryCharging = () => `lipc-get-prop -i com.lab126.powerd isCharging`

export const getWifiConnected = () => `lipc-get-prop -s com.lab126.wifid cmState 2>/dev/null || true`

export const getWifiSignalStrength = () => `lipc-get-prop -s com.lab126.wifid signalStrength 2>/dev/null || true`

export const getWifiSsid = () => `echo '{index=(0)}' | lipc-hash-prop -n com.lab126.wifid currentEssid 2>/dev/null || true`

export const enterScreensaver = () =>
  `lipc-set-prop com.lab126.powerd serverToActive 1 && lipc-set-prop com.lab126.powerd preventScreenSaver 0`

export const openBook = (bookPath: string) =>
  `lipc-set-prop com.lab126.appmgrd start app://com.lab126.booklet.kindle?param=${shellQuote(bookPath)}`

export const listDocuments = (folder: string) =>
  `find ${shellQuote(folder)} -maxdepth 1 -type f \\( -name '*.azw' -o -name '*.azw3' -o -name '*.mobi' -o -name '*.epub' -o -name '*.pdf' \\) -print`
