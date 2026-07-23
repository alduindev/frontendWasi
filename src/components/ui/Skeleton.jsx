export default function Skeleton({ className = '', variant = 'block' }) {
  const variants = {
    avatar: 'h-11 w-11 rounded-full',
    button: 'h-11 rounded-xl',
    image: 'aspect-square rounded-2xl',
    input: 'h-11 rounded-xl',
    line: 'h-4 rounded-full',
    block: 'rounded-xl',
  }

  return <div className={`animate-pulse bg-surface-container-high ${variants[variant] || variants.block} ${className}`} />
}
