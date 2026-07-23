export const calendarDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const monthLabel = (date) =>
  new Intl.DateTimeFormat("es-PE", {
    month: "long",
    year: "numeric",
  }).format(date);

export const dayLabel = (value) =>
  new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Lima",
  }).format(new Date(`${value}T12:00:00-05:00`));

export function buildMonthCells(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 12);
  const leading = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      index - leading + 1,
      12,
    );
    return { date, current: date.getMonth() === cursor.getMonth() };
  });
}
