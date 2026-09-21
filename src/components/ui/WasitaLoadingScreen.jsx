import WasitaMark from "./WasitaMark";

const WELCOME_TEXT = "BIENVENIDO A WASITA";

export default function WasitaLoadingScreen({ accessibleLabel = "Preparando Wasita", statusText = "", variant = "default", welcomeText = WELCOME_TEXT }) {
  const isLogout = variant === "logout";

  return (
    <div
      aria-label={accessibleLabel}
      aria-live="polite"
      className={`wasita-loading-screen ${isLogout ? "wasita-logout-screen" : ""}`}
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
          {Array.from(welcomeText).map((letter, index) => (
            <span
              className="wasita-loading-letter"
              key={`${letter}-${index}`}
              style={{ "--wasita-letter-index": index }}
            >
              {letter === " " ? "\u00A0" : letter}
            </span>
          ))}
        </p>
        {statusText ? <p className="wasita-loading-status">{statusText}</p> : null}
        <span className="sr-only">{accessibleLabel}</span>
      </div>
    </div>
  );
}
