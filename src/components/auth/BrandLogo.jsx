import WasitaMark from "../ui/WasitaMark";

export default function BrandLogo({ centered = false, compact = false, light = false, markOnly = false }) {
  const showMark = markOnly || compact;

  return (
    <div aria-label="Wasita" className={`flex items-center ${centered ? 'justify-center text-center' : ''}`}>
      {showMark ? (
        <WasitaMark className={markOnly ? "h-9 w-9" : "h-10 w-10"} />
      ) : (
        <span className={`whitespace-nowrap font-heading text-3xl font-extrabold leading-none tracking-[-0.04em] ${light ? 'text-white' : 'text-primary'}`}>
          WASITA
        </span>
      )}
    </div>
  )
}
