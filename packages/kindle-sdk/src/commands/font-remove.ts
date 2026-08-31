import { shellQuote } from './utils.js'

export const removeFont = (path: string) =>
  `mv ${shellQuote(path)} ${shellQuote(`${path}-bkp`)}`

export const restoreFont = (path: string) =>
  `mv ${shellQuote(`${path}-bkp`)} ${shellQuote(path)}`
