import { cn } from '../../lib/utils'
import * as React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary'
type ButtonSize = 'sm' | 'md' | 'lg'

const baseClasses =
  'inline-flex items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#FFC107] text-black hover:shadow-[0_0_18px_rgba(255,193,7,0.45)] rounded-full',
  secondary:
    'bg-white/10 border border-[#FFC107] text-white hover:border-[#FFC107] hover:text-[#FFC107] rounded-full',
  tertiary:
    'bg-transparent text-white underline underline-offset-4 hover:text-[#FFC107]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
