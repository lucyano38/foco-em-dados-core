import { cn } from '../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ className, error = false, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg bg-white/10 px-3 text-sm text-[#e3e2e2] placeholder:text-[#d4c5ab]/50',
        'border border-white/10',
        'focus:border-[#FFC107] focus:bg-[#FFC107]/10 focus:outline-none',
        error && 'border-red-400 focus:border-red-400',
        className
      )}
      {...props}
    />
  )
}
