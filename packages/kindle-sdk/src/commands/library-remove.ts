import { shellQuote } from './utils.js'

export const removeBook = (path: string) =>
  `mv ${shellQuote(path)} ${shellQuote(`${path}-bkp`)}`

export const restoreBook = (path: string) =>
  `mv ${shellQuote(`${path}-bkp`)} ${shellQuote(path)}`
