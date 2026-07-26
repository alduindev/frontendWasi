import { useEffect, useState } from "react";

const SHOW_DELAY_MS = 220;
const HIDE_DELAY_MS = 180;

export default function NetworkActivity() {
  const [pending, setPending] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const started = () => setPending((current) => current + 1);
    const finished = () => setPending((current) => Math.max(0, current - 1));

    window.addEventListener("wasi:request-start", started);
    window.addEventListener("wasi:request-end", finished);
    return () => {
      window.removeEventListener("wasi:request-start", started);
      window.removeEventListener("wasi:request-end", finished);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setVisible(pending > 0),
      pending > 0 ? SHOW_DELAY_MS : HIDE_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [pending]);

  if (!visible) return null;

  return (
    <div
      aria-label="Sincronizando información con Wasita"
      aria-valuemax={Math.max(1, pending)}
      aria-valuemin="0"
      aria-valuenow={pending}
      className="pointer-events-none fixed inset-x-0 top-0 z-[500] h-1 overflow-hidden bg-primary-fixed"
      role="progressbar"
    >
      <span className="block h-full w-full animate-pulse bg-gradient-to-r from-primary via-tertiary to-primary" />
      <span className="sr-only">Procesando solicitud</span>
    </div>
  );
}
