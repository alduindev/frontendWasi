import { useEffect, useState } from "react";
import Card from "../../components/atoms/Card";
import EmptyState from "../../components/molecules/EmptyState";
import DashboardShell from "../../components/organisms/DashboardShell";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import { getMedicalDashboard } from "../../services/medicalService";

const metrics = [
  ["patientsTotal", "Pacientes activos", "groups"],
  ["patientsNew", "Pacientes nuevos", "person_add"],
  ["appointmentsToday", "Citas de hoy", "today"],
  ["appointmentsUpcoming", "Próximas citas", "event_upcoming"],
  ["appointmentsCompleted", "Atenciones completadas", "task_alt"],
  ["appointmentsPending", "Atenciones pendientes", "pending_actions"],
  ["resultsPending", "Resultados pendientes", "science"],
  ["professionalsAvailable", "Profesionales disponibles", "medical_services"],
];

export default function MedicalDashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      setSummary(await getMedicalDashboard());
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    queueMicrotask(load);
  }, []);
  useLiveRefresh(load, ["/medical"]);

  return (
    <DashboardShell
      subtitle="Resumen de pacientes, agenda y atenciones del consultorio."
      title="Dashboard médico"
    >
      {error ? (
        <EmptyState
          description={error}
          icon="cloud_off"
          title="No se pudo cargar el dashboard"
        />
      ) : null}
      {!summary && !error ? <Card className="h-52 animate-pulse" /> : null}
      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([key, label, icon]) => (
            <Card className="min-h-32 p-4" key={key}>
              <span className="material-symbols-outlined text-primary">{icon}</span>
              <p className="mt-3 text-3xl font-bold">{summary[key] || 0}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{label}</p>
            </Card>
          ))}
        </div>
      ) : null}
    </DashboardShell>
  );
}