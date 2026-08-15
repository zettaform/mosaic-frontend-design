export * from './chat'
export * from './ui'

export interface BaseComponent {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  hasNext: boolean
  hasPrev: boolean
}
