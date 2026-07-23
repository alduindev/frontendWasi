export default function BrandLogo({ centered = false, compact = false, light = false, markOnly = false }) {
  return (
    <div aria-label="Wasita" className={`flex items-center ${centered ? 'justify-center text-center' : ''}`}>
      <span className={`whitespace-nowrap font-heading font-extrabold leading-none tracking-[-0.04em] ${markOnly ? 'text-3xl' : compact ? 'text-2xl' : 'text-3xl'} ${light ? 'text-white' : 'text-primary'}`}>
        {markOnly || compact ? 'W' : 'WASITA'}
      </span>
    </div>
  )
}
