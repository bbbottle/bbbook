import { shellQuote } from './utils.js'

export const removeFont = (path: string) => {
  const backup = `${path}-bkp`
  return `if [ -e ${shellQuote(backup)} ]; then echo 'backup already exists' >&2; exit 1; fi; mv ${shellQuote(path)} ${shellQuote(backup)}`
}

export const restoreFont = (path: string) => {
  const backup = `${path}-bkp`
  return `if [ -e ${shellQuote(path)} ]; then echo 'origin already exists' >&2; exit 1; fi; mv ${shellQuote(backup)} ${shellQuote(path)}`
}
