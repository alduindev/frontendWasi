import { useEffect, useRef, useState } from "react";
import { ChatPanel } from "../../pages/chat/BusinessChat";
import { useAuth } from "../../context/authStore";

export default function FloatingBusinessChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target))
        setOpen(false);
    };
    const escape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  if (!user?.businessId) return null;
  return (
    <div
      className="fixed bottom-4 right-20 z-[121] hidden lg:block"
      ref={panelRef}
    >
      {open ? (
        <div className="absolute bottom-16 right-0 w-[390px] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
          <div className="flex items-center justify-between border-b border-outline-variant bg-white px-4 py-3">
            <div>
              <p className="font-bold">Chat del negocio</p>
              <p className="text-xs text-on-surface-variant">
                Conversación interna del equipo
              </p>
            </div>
            <button
              aria-label="Cerrar chat"
              className="material-symbols-outlined min-h-10 min-w-10 rounded-full hover:bg-surface-container-low"
              onClick={() => setOpen(false)}
              type="button"
            >
              close
            </button>
          </div>
          <ChatPanel className="h-[min(560px,calc(100svh-130px))] rounded-t-none border-0" />
        </div>
      ) : null}
      <button
        aria-expanded={open}
        aria-label={open ? "Cerrar chat del negocio" : "Abrir chat del negocio"}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-lg ring-1 ring-primary/20 transition hover:scale-105 hover:bg-primary-fixed"
        onClick={() => setOpen((value) => !value)}
        title="Chat del negocio"
        type="button"
      >
        <span className="material-symbols-outlined">
          {open ? "close" : "chat_bubble"}
        </span>
      </button>
    </div>
  );
}
