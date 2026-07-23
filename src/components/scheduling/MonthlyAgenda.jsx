import { useMemo, useState } from "react";
import Card from "../atoms/Card";
import HorizontalScroller from "../atoms/HorizontalScroller";
import EmptyState from "../molecules/EmptyState";
import Button from "../atoms/Button";
import {
  buildMonthCells,
  calendarDateKey,
  dayLabel,
  monthLabel,
} from "./calendarUtils";

const weekdays = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

export function MonthCalendarGrid({
  canViewPast = true,
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
  statusMeta,
  today,
}) {
  const cells = useMemo(() => buildMonthCells(cursor), [cursor]);
  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-outline-variant p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-center gap-1 lg:justify-start">
          <button
            aria-label="Mes anterior"
            className="material-symbols-outlined min-h-10 min-w-10 rounded-full p-2 hover:bg-primary-fixed"
            onClick={() => onMoveMonth(-1)}
            type="button"
          >
            chevron_left
          </button>
          <h2 className="min-w-44 text-center text-lg font-bold capitalize">
            {monthLabel(cursor)}
          </h2>
          <button
            aria-label="Mes siguiente"
            className="material-symbols-outlined min-h-10 min-w-10 rounded-full p-2 hover:bg-primary-fixed"
            onClick={() => onMoveMonth(1)}
            type="button"
          >
            chevron_right
          </button>
        </div>
        <HorizontalScroller
          className="gap-1"
          label="Filtros del calendario"
        >
          {filters.map((item) => (
            <button
              className={`flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-bold ${selectedFilter === item.value ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"}`}
              key={item.value}
              onClick={() => onFilter(item.value)}
              type="button"
            >
              <span className="material-symbols-outlined text-base">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </HorizontalScroller>
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
                  className={`min-h-[4.75rem] border-b border-r border-outline-variant p-1 text-left transition sm:min-h-24 sm:p-1.5 ${!cell.current ? "bg-surface-container-low/50 text-outline" : ""} ${key === today ? "ring-2 ring-inset ring-primary" : ""} ${key === selectedDate ? "bg-primary-fixed" : ""} ${disabled ? "cursor-not-allowed opacity-45" : "hover:bg-primary-fixed/40"}`}
                  disabled={disabled}
                  key={key}
                  onClick={() => onSelectDate(cell.date)}
                  type="button"
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold sm:h-7 sm:w-7 sm:text-xs ${key === selectedDate ? "bg-primary text-white" : ""}`}
                  >
                    {cell.date.getDate()}
                  </span>
                  <div className="mt-1 grid gap-0.5">
                    {events.slice(0, 3).map((event) => (
                      <span
                        className="flex min-w-0 items-center gap-1 truncate text-[8px] sm:text-[9px]"
                        key={event.id}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${(statusMeta[event.status] || statusMeta.default).dot}`}
                        />
                        <span className="truncate">{getEventLabel(event)}</span>
                      </span>
                    ))}
                    {events.length > 3 ? (
                      <span className="text-[8px] font-bold text-primary sm:text-[9px]">
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
      <div className="border-b border-outline-variant px-2 pt-2">
        <HorizontalScroller className="gap-1" label="Estados de la agenda">
          {groups.map((item) => (
            <button
              className={`min-w-[82px] shrink-0 snap-start rounded-xl p-2 text-center ${resolvedActive === item.value ? "bg-primary text-white shadow-md" : "bg-surface-container-low text-on-surface-variant hover:bg-primary-fixed"}`}
              key={item.value}
              onClick={() => setActive(item.value)}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">
                {item.icon}
              </span>
              <b className="block text-lg leading-5">{item.events.length}</b>
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </HorizontalScroller>
      </div>
      <div className="min-h-72 max-h-[46vh] overflow-y-auto p-3">
        {group ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <span className="material-symbols-outlined text-primary">
                  {group.icon}
                </span>
                {group.label}
              </h3>
              <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-xs font-bold text-primary">
                {group.events.length}
              </span>
            </div>
            <div className="grid gap-2">
              {group.events.map((event) => (
                <button
                  className="rounded-xl border border-outline-variant p-3 text-left transition hover:border-primary hover:bg-primary-fixed/30"
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
      {canSchedule ? (
        <div className="border-t border-outline-variant p-3">
          <Button
            className="w-full"
            disabled={past}
            icon="event_available"
            onClick={onSchedule}
          >
            {past ? "Fecha histórica" : "Agendar para este día"}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
