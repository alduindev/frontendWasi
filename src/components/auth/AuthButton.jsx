import InlineSpinner from "../ui/InlineSpinner";

export default function AuthButton({
  children,
  className = "",
  disabled = false,
  icon = "arrow_forward",
  loading = false,
  loadingLabel = "Procesando...",
  variant = "primary",
  ...props
}) {
  const styles =
    variant === "secondary"
      ? "border-2 border-primary-container bg-white text-primary-container hover:bg-surface-container-low"
      : "bg-primary-container text-white shadow-lg shadow-primary-container/20 hover:bg-primary";

  return (
    <button
      aria-busy={loading || undefined}
      className={`flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-2xl px-5 py-4 text-center text-base font-bold transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 ${styles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <InlineSpinner /> : null}
      <span>{loading ? loadingLabel : children}</span>
      {!loading && icon ? (
        <span aria-hidden="true" className="material-symbols-outlined text-xl">
          {icon}
        </span>
      ) : null}
      {loading ? (
        <span aria-live="polite" className="sr-only" role="status">
          {loadingLabel}
        </span>
      ) : null}
    </button>
  );
}
