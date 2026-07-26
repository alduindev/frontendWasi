import { useId } from "react";

export default function WasitaMark({
  animated = false,
  className = "",
  title = "",
}) {
  const gradientId = `wasita-mark-${useId().replaceAll(":", "")}`;

  return (
    <svg
      aria-hidden={title ? undefined : "true"}
      className={className}
      role={title ? "img" : undefined}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gradientId} x1="8" x2="56" y1="8" y2="56">
          <stop offset="0" stopColor="#7c80f5" />
          <stop offset="1" stopColor="#5b5fef" />
        </linearGradient>
      </defs>
      {animated ? (
        <circle className="wasita-loading-orbit" cx="32" cy="32" r="29" />
      ) : null}
      <rect
        fill={`url(#${gradientId})`}
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
  );
}
