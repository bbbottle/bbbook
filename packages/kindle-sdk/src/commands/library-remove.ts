import { shellQuote } from './utils.js'

export const removeBook = (path: string) => `rm -f ${shellQuote(path)}`
