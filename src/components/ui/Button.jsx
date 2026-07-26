import InlineSpinner from "./InlineSpinner";

export default function Button({
  children,
  className = "",
  disabled = false,
  icon,
  loading = false,
  loadingLabel = "Procesando...",
  variant = "primary",
  ...props
}) {
  const variants = {
    primary:
      "bg-primary text-white shadow-lg shadow-primary/15 hover:brightness-110",
    secondary:
      "border border-outline-variant bg-white text-on-surface shadow-sm hover:border-primary hover:bg-surface-container-low",
    danger:
      "bg-error text-white shadow-lg shadow-error/15 hover:brightness-110",
    ghost:
      "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
  };

  return (
    <button
      aria-busy={loading || undefined}
      className={`inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-center text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-primary/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <InlineSpinner /> : null}
      {!loading && icon ? (
        <span aria-hidden="true" className="material-symbols-outlined text-xl">
          {icon}
        </span>
      ) : null}
      <span>{loading ? loadingLabel : children}</span>
      {loading ? (
        <span aria-live="polite" className="sr-only" role="status">
          {loadingLabel}
        </span>
      ) : null}
    </button>
  );
}
