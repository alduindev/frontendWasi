import { useEffect, useState } from "react";
import Button from "../atoms/Button";
import ConfirmDialog from "../molecules/ConfirmDialog";
import {
  clockIn,
  clockOut,
  getMyAttendance,
} from "../../services/attendanceService";

const hour = (value) =>
  value
    ? new Date(value).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";
export default function AttendanceWidget() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmExit, setConfirmExit] = useState(false);
  const load = () =>
    getMyAttendance()
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    queueMicrotask(load);
  }, []);
  const action = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      setConfirmExit(false);
    }
  };
  if (!data) return null;
  const record = data.record || {};
  return (
    <>
      <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-outline-variant bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined rounded-xl bg-primary-fixed p-2 text-primary">
            schedule
          </span>
          <div>
            <p className="font-bold">Mi jornada de hoy</p>
            <p className="text-xs text-on-surface-variant">
              {data.schedule?.isWorkday
                ? `Horario ${data.schedule.startTime} – ${data.schedule.endTime} · tolerancia ${data.schedule.toleranceMinutes} min`
                : "Sin turno programado"}{" "}
              · Entrada {hour(record.clockInAt)} · Salida{" "}
              {hour(record.clockOutAt)}
            </p>
            {record.late ? (
              <p className="text-xs font-bold text-amber-700">
                Entrada registrada fuera de tolerancia.
              </p>
            ) : null}
            {error ? (
              <p className="text-xs font-bold text-error">{error}</p>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          {!record.clockInAt ? (
            <Button
              disabled={busy}
              icon="login"
              onClick={() => action(clockIn)}
            >
              Registrar entrada
            </Button>
          ) : !record.clockOutAt ? (
            <Button
              disabled={busy}
              icon="logout"
              onClick={() => setConfirmExit(true)}
              variant="secondary"
            >
              Registrar salida
            </Button>
          ) : (
            <span className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
              Jornada cerrada
              {record.workedMinutes != null
                ? ` · ${Math.floor(record.workedMinutes / 60)}h ${record.workedMinutes % 60}m`
                : ""}
            </span>
          )}
        </div>
      </section>
      <ConfirmDialog
        description="Se registrará la hora actual como fin de tu jornada. Esta acción solo puede corregirla un administrador con un motivo."
        onCancel={() => setConfirmExit(false)}
        onConfirm={() => action(clockOut)}
        open={confirmExit}
        title="Confirmar salida"
      />
    </>
  );
}
