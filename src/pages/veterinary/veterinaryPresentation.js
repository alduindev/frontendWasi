export const veterinaryStatusMeta = {
  scheduled: {
    label: "Programada",
    icon: "event",
    dot: "bg-primary",
    tone: "bg-primary-fixed text-primary",
  },
  confirmed: {
    label: "Confirmada",
    icon: "event_available",
    dot: "bg-sky-500",
    tone: "bg-sky-100 text-sky-900",
  },
  in_attention: {
    label: "En atención",
    icon: "pets",
    dot: "bg-violet-500",
    tone: "bg-violet-100 text-violet-900",
  },
  completed: {
    label: "Finalizada",
    icon: "task_alt",
    dot: "bg-emerald-500",
    tone: "bg-emerald-100 text-emerald-900",
  },
  no_show: {
    label: "No asistió",
    icon: "person_off",
    dot: "bg-slate-500",
    tone: "bg-slate-100 text-slate-900",
  },
  cancelled: {
    label: "Cancelada",
    icon: "event_busy",
    dot: "bg-error",
    tone: "bg-error-container text-error",
  },
};
veterinaryStatusMeta.default = veterinaryStatusMeta.scheduled;

const limaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Lima",
  year: "numeric",
});

export function dateKeyInLima(value) {
  const parts = Object.fromEntries(
    limaDateFormatter
      .formatToParts(new Date(value))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function timeInLima(value) {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  }).format(new Date(value));
}

export function dateTimeInLima(value) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
}
