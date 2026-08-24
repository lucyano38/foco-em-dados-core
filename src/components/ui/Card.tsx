import { cn } from '../../lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
}

export function Card({ glass = true, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        glass
          ? 'glassmorphism border border-white/10'
          : 'bg-[#18191c] border border-white/5',
        'rounded-2xl p-8',
        className
      )}
      {...props}
    />
  )
}
