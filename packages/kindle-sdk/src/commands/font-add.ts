import { shellQuote } from './utils.js'

export const ensureFontFolder = (folder: string) => `mkdir -p ${shellQuote(folder)}`
