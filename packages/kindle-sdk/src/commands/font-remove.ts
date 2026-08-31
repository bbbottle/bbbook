import { shellQuote } from './utils.js'

export const removeFont = (path: string) => `rm -f ${shellQuote(path)}`
