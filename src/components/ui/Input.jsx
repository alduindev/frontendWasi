export default function Input({ className = '', inputClassName = '', label, suffix, ...props }) {
  const phoneField = /tel[eé]fono/i.test(String(label || ''))
  const inputProps = phoneField ? { ...props, inputMode: props.inputMode || 'numeric', maxLength: props.maxLength || 15, minLength: props.minLength || 6, pattern: props.pattern || '\\d{6,15}', type: props.type || 'tel', onInput: event => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, 15); props.onInput?.(event) } } : props
  return (
    <label className={`grid min-w-0 gap-1.5 text-sm font-bold text-on-surface-variant ${className}`}>
      {label}
      <span className="relative block min-w-0">
        <input
          className={`min-h-11 w-full min-w-0 rounded-xl border border-outline-variant bg-white px-3 py-2.5 text-sm font-normal text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 ${suffix ? 'pr-12' : ''} ${inputClassName}`}
          {...inputProps}
        />
        {suffix}
      </span>
    </label>
  )
}
