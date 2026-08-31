import { shellQuote } from './utils.js'

export const ensureLibraryFolder = (folder: string) =>
  `mkdir -p ${shellQuote(folder)}`
