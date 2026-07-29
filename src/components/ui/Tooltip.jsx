export default function Tooltip({ children, label, placement = "top" }) {
  const positions = {
    top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    "top-start": "bottom-full left-0 mb-2",
    "top-end": "bottom-full right-0 mb-2",
  };

  return (
    <span className="group relative inline-flex shrink-0">
      {children}
      <span
        aria-hidden="true"
        className={`pointer-events-none invisible absolute z-50 w-max max-w-[calc(100vw-2rem)] whitespace-nowrap rounded-lg bg-on-surface px-2 py-1 text-center text-xs font-bold leading-snug text-white opacity-0 shadow-lg transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${positions[placement] || positions.top}`}
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
}
