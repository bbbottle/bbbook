const shellQuote = (value: string | number) =>
  typeof value === 'number' ? String(value) : `'${value.replace(/'/g, "'\\''")}'`

export const setPreventScreenSaver = (prevent: boolean) =>
  `lipc-set-prop com.lab126.powerd preventScreenSaver ${prevent ? 1 : 0}`

export const getBatteryLevel = () => `lipc-get-prop -s com.lab126.powerd battLevel`

export const getBatteryCharging = () => `lipc-get-prop -s com.lab126.powerd charging`

export const enterScreensaver = () =>
  `lipc-set-prop com.lab126.powerd serverToActive 1 && lipc-set-prop com.lab126.powerd preventScreenSaver 0`

export const openBook = (bookPath: string) =>
  `lipc-set-prop com.lab126.appmgrd start app://com.lab126.booklet.kindle?param=${shellQuote(bookPath)}`

export const listDocuments = (folder: string) =>
  `find ${shellQuote(folder)} -maxdepth 1 -type f \\( -name '*.azw' -o -name '*.azw3' -o -name '*.mobi' -o -name '*.epub' -o -name '*.pdf' \\) -print`
