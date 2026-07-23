import { Link } from "react-router-dom";
import Card from "../../components/atoms/Card";
import DashboardShell from "../../components/organisms/DashboardShell";
import { useAppConfig } from "../../context/appConfigStore";
const descriptions = {
  hospitality:
    "Gestiona ocupacion, reservas, huespedes y operacion diaria desde un solo lugar.",
  health:
    "Organiza pacientes, agenda, atenciones y facturacion de tu centro de salud.",
  dental:
    "Gestiona pacientes, agenda, odontogramas y planes de tratamiento desde un expediente integrado.",
  restaurant:
    "Controla mesas, pedidos, cocina, caja e inventario en tiempo real.",
  veterinary:
    "Administra mascotas, propietarios, citas y seguimiento veterinario.",
};
export default function IndustryDashboard() {
  const { config } = useAppConfig();
  const key = config?.template?.dashboardKey || "industry";
  const modules = (config?.navigation || []).filter(
    (x) => x.frontendKey !== "dashboard",
  );
  return (
    <DashboardShell
      title={`Dashboard ${config?.business?.name || ""}`}
      subtitle={
        descriptions[key] || "Tu espacio se adapta a los modulos habilitados."
      }
    >
      <Card className="mb-4 bg-primary p-6 text-white">
        <p className="text-sm font-bold uppercase tracking-widest opacity-80">
          Experiencia especializada
        </p>
        <h2 className="mt-2 text-3xl font-extrabold capitalize">{key}</h2>
        <p className="mt-2 max-w-2xl opacity-90">{descriptions[key]}</p>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((m) => (
          <Link
            className="group rounded-2xl border border-outline-variant bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary"
            key={m.code}
            to={m.route}
          >
            <span className="material-symbols-outlined text-4xl text-primary">
              {m.icon}
            </span>
            <h3 className="mt-4 text-xl font-bold group-hover:text-primary">
              {m.label}
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Abrir modulo especializado
            </p>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
