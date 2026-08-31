import { shellQuote } from './utils.js'

export const captureScreenshot = (remotePath: string) =>
  `fbgrab -f /dev/fb0 ${shellQuote(remotePath)} 2>/dev/null`
