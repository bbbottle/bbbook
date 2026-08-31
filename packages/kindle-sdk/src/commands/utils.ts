export const shellQuote = (value: string | number) =>
  typeof value === 'number' ? String(value) : `'${value.replace(/'/g, "'\\''")}'`
