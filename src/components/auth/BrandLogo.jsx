import WasitaMark from "../ui/WasitaMark";

export default function BrandLogo({ centered = false, compact = false, light = false, markOnly = false }) {
  const markSize = markOnly ? "h-9 w-9" : compact ? "h-10 w-10" : "h-11 w-11";
  const wordmarkSize = compact ? "text-2xl" : "text-3xl";

  return (
    <div
      aria-label="Wasita"
      className={`flex items-center gap-2.5 ${centered ? "justify-center text-center" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`grid shrink-0 place-items-center rounded-2xl ${light ? "bg-white shadow-sm shadow-black/10" : ""}`}
      >
        <WasitaMark className={markSize} />
      </span>
      {markOnly ? null : (
        <span
          className={`whitespace-nowrap font-heading font-extrabold leading-none tracking-[-0.04em] ${wordmarkSize} ${
            light ? "text-white" : "text-primary"
          }`}
        >
          WASITA
        </span>
      )}
    </div>
  );
}
