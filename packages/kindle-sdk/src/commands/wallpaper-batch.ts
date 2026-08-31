import { shellQuote } from './utils.js'

export const applyWallpaper = (remotePath: string) =>
  `eips -f -g ${shellQuote(remotePath)}`
