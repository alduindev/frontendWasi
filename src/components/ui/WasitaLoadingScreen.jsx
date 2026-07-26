import WasitaMark from "./WasitaMark";

const WELCOME_TEXT = "BIENVENIDO A WASITA";

export default function WasitaLoadingScreen() {
  return (
    <div
      aria-label="Preparando Wasita"
      aria-live="polite"
      className="wasita-loading-screen"
      role="status"
    >
      <div className="wasita-loading-content">
        <div className="wasita-loading-mark" aria-hidden="true">
          <span className="wasita-loading-glow" />
          <WasitaMark
            animated
            className="wasita-loading-logo"
          />
        </div>

        <p className="wasita-loading-welcome" aria-hidden="true">
          {Array.from(WELCOME_TEXT).map((letter, index) => (
            <span
              className="wasita-loading-letter"
              key={`${letter}-${index}`}
              style={{ "--wasita-letter-index": index }}
            >
              {letter === " " ? "\u00A0" : letter}
            </span>
          ))}
        </p>
        <span className="sr-only">Preparando tu espacio en Wasita</span>
      </div>
    </div>
  );
}
