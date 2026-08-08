import { useMemo, useState } from "react";
import Card from "../atoms/Card";
import EmptyState from "../molecules/EmptyState";
import Button from "../atoms/Button";
import {
  buildMonthCells,
  calendarDateKey,
  dayLabel,
  monthLabel,
} from "./calendarUtils";

const weekdays = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

export function AgendaFilterBar({
  className = "",
  filters = [],
  onChange,
  value,
}) {
  return (
    <div className={`mb-3 flex flex-wrap gap-2 ${className}`.trim()}>
      {filters.map((item) => (
        <button
          aria-pressed={value === item.value}
          className={`flex min-h-10 min-w-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-bold transition ${value === item.value ? "border-primary bg-primary text-white" : "border-outline-variant bg-white text-on-surface-variant hover:border-primary hover:bg-primary-fixed"}`}
          key={item.value}
          onClick={() => onChange(item.value)}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-lg">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export function MonthCalendarGrid({
  canViewPast = true,
  compact = false,
  cursor,
  eventsByDate,
  filters,
  getEventLabel,
  loading = false,
  onFilter,
  onMoveMonth,
  onSelectDate,
  selectedDate,
  selectedFilter,
  showFilters = true,
  statusMeta,
  today,
}) {
  const cells = useMemo(() => buildMonthCells(cursor), [cursor]);
  const cellSize = compact ? "min-h-[68px] p-1 sm:min-h-[92px]" : "min-h-[76px] p-1.5 sm:min-h-[108px]";
  return (
    <Card className="min-w-0 overflow-hidden">
      {showFilters && filters.length ? (
        <AgendaFilterBar
          className="m-3 mb-0"
          filters={filters}
          onChange={onFilter}
          value={selectedFilter}
        />
      ) : null}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-outline-variant p-3">
        <button
          aria-label="Mes anterior"
          className="grid size-10 place-items-center rounded-xl border border-outline-variant bg-white text-primary transition hover:bg-primary-fixed"
          onClick={() => onMoveMonth(-1)}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            chevron_left
          </span>
        </button>
        <h2 className="truncate text-center font-heading text-base font-bold capitalize sm:text-lg">
          {monthLabel(cursor)}
        </h2>
        <button
          aria-label="Mes siguiente"
          className="grid size-10 place-items-center rounded-xl border border-outline-variant bg-white text-primary transition hover:bg-primary-fixed"
          onClick={() => onMoveMonth(1)}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            chevron_right
          </span>
        </button>
      </div>
      {loading ? (
        <div className="h-[32rem] animate-pulse bg-surface-container-low" />
      ) : (
        <>
          <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low">
            {weekdays.map((day) => (
              <div
                className="p-2 text-center text-[10px] font-bold text-on-surface-variant"
                key={day}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell) => {
              const key = calendarDateKey(cell.date);
              const events = eventsByDate[key] || [];
              const past = key < today;
              const disabled = past && !canViewPast;
              return (
                <button
                  aria-label={`${key}, ${events.length} evento(s)`}
                  className={`relative min-w-0 overflow-hidden border-b border-r border-outline-variant text-left transition ${cellSize} ${cell.current ? past ? "bg-surface-container-low/70 text-on-surface-variant" : "bg-white" : "bg-surface-container-low text-on-surface-variant"} ${key === selectedDate ? "ring-2 ring-inset ring-primary" : "hover:bg-primary-fixed/30"} ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
                  disabled={disabled}
                  key={key}
                  onClick={() => onSelectDate(cell.date)}
                  type="button"
                >
                  <span className="flex items-center gap-1">
                    <span
                      className={`grid size-6 place-items-center rounded-full text-xs font-bold ${key === today ? "bg-primary text-white" : ""}`}
                    >
                      {cell.date.getDate()}
                    </span>
                    {past && cell.current ? (
                      <span aria-hidden="true" className="material-symbols-outlined text-sm text-on-surface-variant">
                        history
                      </span>
                    ) : null}
                  </span>
                  <div className="mt-1 grid min-w-0 gap-1">
                    {events.slice(0, 3).map((event, index) => {
                      const meta = statusMeta?.[event.status] || statusMeta?.default;
                      return (
                        <span
                          className={`min-w-0 truncate rounded px-1 py-1 text-[9px] font-bold sm:px-1.5 sm:text-[10px] ${meta?.tone || "bg-primary-fixed text-primary"}`}
                          key={`${key}-${event.id || event.startsAt || event.patient?.id || "event"}-${index}`}
                          title={getEventLabel(event)}
                        >
                          {getEventLabel(event)}
                        </span>
                      );
                    })}
                    {events.length > 3 ? (
                      <span className="truncate text-[10px] font-bold text-primary">
                        +{events.length - 3} más
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

export function DayAgendaPanel({
  canSchedule,
  date,
  events,
  filters,
  onEvent,
  onSchedule,
  past,
  renderEvent,
}) {
  const groups = filters.slice(1).map((item) => ({
    ...item,
    events: events.filter((event) => event.status === item.value),
  }));
  const preferred = groups.find((item) => item.events.length)?.value;
  const [active, setActive] = useState(preferred || groups[0]?.value || "");
  const resolvedActive = groups.some((item) => item.value === active)
    ? active
    : preferred || groups[0]?.value || "";
  const group =
    groups.find((item) => item.value === resolvedActive) || groups[0];
  return (
    <Card className="overflow-hidden">
      <div className="bg-primary p-4 text-white">
        <p className="text-xs font-bold uppercase tracking-wider text-white/70">
          Agenda del día
        </p>
        <h2 className="mt-1 text-xl font-bold capitalize">{dayLabel(date)}</h2>
        <p className="mt-2 text-sm text-white/80">
          {events.length} cita(s) programada(s)
        </p>
      </div>
      <div className="grid grid-cols-3 gap-1 border-b border-outline-variant p-2">
        {groups.map((item) => (
          <button
            aria-pressed={resolvedActive === item.value}
            className={`grid min-w-0 place-items-center gap-0.5 rounded-xl p-2 text-center transition ${resolvedActive === item.value ? "bg-primary text-white shadow-md" : "bg-surface-container-low text-on-surface-variant hover:bg-primary-fixed"}`}
            key={item.value}
            onClick={() => setActive(item.value)}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              {item.icon}
            </span>
            <b className="text-base leading-none">{item.events.length}</b>
            <span className="w-full truncate text-[10px] leading-tight" title={item.label}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
      <div className="min-h-[20rem] max-h-[52vh] overflow-y-auto p-3">
        {group ? (
          <>
            <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
              <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold">
                <span aria-hidden="true" className="material-symbols-outlined shrink-0 text-primary">
                  {group.icon}
                </span>
                <span className="truncate">{group.label}</span>
              </h3>
              <span className="shrink-0 rounded-full bg-primary-fixed px-2 py-0.5 text-xs font-bold text-primary">
                {group.events.length}
              </span>
            </div>
            <div className="grid gap-2">
              {group.events.map((event) => (
                <button
                  className="min-w-0 rounded-xl border border-outline-variant p-3 text-left transition hover:border-primary hover:bg-primary-fixed/30"
                  key={event.id}
                  onClick={() => onEvent(event)}
                  type="button"
                >
                  {renderEvent(event)}
                </button>
              ))}
            </div>
            {!group.events.length ? (
              <div className="grid min-h-56 place-items-center">
                <EmptyState
                  description={`No hay citas ${group.label.toLowerCase()} para este día.`}
                  icon={group.icon}
                  title={`Sin citas ${group.label.toLowerCase()}`}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>
      {canSchedule && !past ? (
        <div className="border-t border-outline-variant p-3">
          <Button className="w-full" icon="event_available" onClick={onSchedule}>
            Agendar para este día
          </Button>
        </div>
      ) : null}
      {past ? (
        <div className="flex items-center gap-2 border-t border-outline-variant bg-surface-container-low p-3 text-sm text-on-surface-variant">
          <span aria-hidden="true" className="material-symbols-outlined text-primary">history</span>
          <span><b className="text-on-surface">Día histórico.</b> Puedes revisar las citas y atenciones realizadas, pero no agendar una nueva.</span>
        </div>
      ) : null}
    </Card>
  );
}
