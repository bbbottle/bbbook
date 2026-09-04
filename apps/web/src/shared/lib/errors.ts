export function getErrorCode(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'UNKNOWN_ERROR'
}
