import { shellQuote } from './utils.js'

export const listFonts = (folder = '/mnt/us/fonts') =>
  `find ${shellQuote(folder)} -maxdepth 1 -type f \\( -name '*.ttf' -o -name '*.otf' \\) -print`
