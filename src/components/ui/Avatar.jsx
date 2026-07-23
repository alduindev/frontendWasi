export default function Avatar({ name = 'Usuario', src }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-surface-container-low text-sm font-bold text-primary">
      {src ? <img alt={name} className="h-full w-full object-cover" src={src} /> : initials}
    </div>
  )
}
