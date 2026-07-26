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
          <svg
            className="wasita-loading-logo"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="wasita-loader-gradient" x1="8" x2="56" y1="8" y2="56">
                <stop offset="0" stopColor="#7c80f5" />
                <stop offset="1" stopColor="#5b5fef" />
              </linearGradient>
            </defs>
            <circle className="wasita-loading-orbit" cx="32" cy="32" r="29" />
            <rect
              fill="url(#wasita-loader-gradient)"
              height="48"
              rx="15"
              width="48"
              x="8"
              y="8"
            />
            <path
              d="M18 22.5 24.4 42 32 29.8 39.6 42 46 22.5"
              fill="none"
              stroke="white"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="5"
            />
          </svg>
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
