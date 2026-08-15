import { ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type InputVariant = 'default' | 'error' | 'success'
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  title?: string
  children: ReactNode
}

export interface InputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  helperText?: string
  variant?: InputVariant
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  className?: string
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: ModalSize
  children: ReactNode
  className?: string
}

export interface SkeletonProps {
  className?: string
  lines?: number
  height?: string
  width?: string
  rounded?: boolean
}

export interface DropdownOption {
  value: string
  label: string
  disabled?: boolean
  icon?: ReactNode
}

export interface DropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}
