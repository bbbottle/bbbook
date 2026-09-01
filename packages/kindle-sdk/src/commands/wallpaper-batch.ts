import { shellQuote } from './utils.js'

const WALLPAPER_FOLDER = '/mnt/us/system/screen_saver'

export const applyWallpaper = (remotePath: string) =>
  `eips -f -g ${shellQuote(remotePath)}`

export const backupWallpapers = (folder = WALLPAPER_FOLDER) =>
  `if [ -e ${shellQuote(`${folder}-bkp`)} ]; then echo 'backup already exists' >&2; exit 1; fi; if [ -d ${shellQuote(folder)} ]; then cp -r ${shellQuote(folder)} ${shellQuote(`${folder}-bkp`)}; fi`

export const restoreWallpapers = (folder = WALLPAPER_FOLDER) =>
  `if [ ! -e ${shellQuote(`${folder}-bkp`)} ]; then echo 'backup not found' >&2; exit 1; fi; rm -rf ${shellQuote(folder)} && mv ${shellQuote(`${folder}-bkp`)} ${shellQuote(folder)}`

export const ensureWallpaperFolder = (folder = WALLPAPER_FOLDER) =>
  `mkdir -p ${shellQuote(folder)}`
