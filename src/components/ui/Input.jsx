export default function Input({ className = '', error = '', inputClassName = '', label, suffix, ...props }) {
  const phoneField = /tel[eé]fono/i.test(String(label || ''))
  const phoneMaxLength = Number(props.maxLength || 15)
  const errorId = error && props.name ? `${props.name}-error` : undefined
  const inputProps = phoneField ? { ...props, inputMode: props.inputMode || 'numeric', maxLength: phoneMaxLength, minLength: props.minLength || 6, pattern: props.pattern || '\\d{6,15}', type: props.type || 'tel', onInput: event => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, phoneMaxLength); props.onInput?.(event) } } : props
  return (
    <label className={`grid min-w-0 gap-1.5 text-sm font-bold text-on-surface-variant ${className}`}>
      {label}
      <span className="relative block min-w-0">
        <input
          aria-describedby={errorId || inputProps['aria-describedby']}
          aria-invalid={error ? true : inputProps['aria-invalid']}
          className={`min-h-11 w-full min-w-0 rounded-xl border bg-white px-3 py-2.5 text-sm font-normal text-on-surface outline-none transition placeholder:text-outline focus:ring-2 ${error ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} ${suffix ? 'pr-12' : ''} ${inputClassName}`}
          {...inputProps}
        />
        {suffix}
      </span>
      {error ? <small className="font-normal text-error" id={errorId} role="alert">{error}</small> : null}
    </label>
  )
}
