import type { Dispatch, RefObject, SetStateAction } from 'react'

export interface AppOutletContext {
  query: string
  setQuery: Dispatch<SetStateAction<string>>
  mainRef: RefObject<HTMLElement | null>
}
