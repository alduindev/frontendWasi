export default function AuthField({
  id,
  label,
  icon,
  action,
  prefix,
  suffix,
  className = '',
  inputClassName = '',
  ...inputProps
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label className="ml-1 block text-sm font-semibold text-on-surface-variant" htmlFor={id}>
          {label}
        </label>
        {action}
      </div>
      <div className="flex min-w-0 gap-2">
        {prefix ? (
          <div className="flex h-[52px] w-16 shrink-0 items-center justify-center rounded-2xl border border-outline-variant bg-secondary-container/50 text-sm font-semibold text-on-surface-variant sm:w-20">
            {prefix}
          </div>
        ) : null}
        <div className="relative min-w-0 flex-1">
          {icon ? (
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              {icon}
            </span>
          ) : null}
          <input
            className={`h-[52px] w-full rounded-2xl border border-outline-variant bg-surface-container-lowest py-3 pr-4 text-base text-on-surface outline-none transition focus:border-primary-container focus:ring-4 focus:ring-primary-container/15 ${
              icon ? 'pl-12' : 'pl-4'
            } ${suffix ? 'pr-12' : ''} ${inputClassName}`}
            id={id}
            name={id}
            {...inputProps}
          />
          {suffix}
        </div>
      </div>
    </div>
  )
}
