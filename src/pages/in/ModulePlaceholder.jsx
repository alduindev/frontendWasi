import { Navigate, useParams } from "react-router-dom";
import Card from "../../components/atoms/Card";
import DashboardShell from "../../components/organisms/DashboardShell";
import { useAppConfig } from "../../context/appConfigStore";
export default function ModulePlaceholder() {
  const { moduleKey } = useParams();
  const { config, isLoading } = useAppConfig();
  if (isLoading)
    return (
      <div className="grid min-h-[50vh] place-items-center text-primary">
        Cargando modulo...
      </div>
    );
  const module = config?.modules?.find((x) => x.frontendKey === moduleKey);
  if (!module) return <Navigate replace to="/dashboard" />;
  return (
    <DashboardShell
      title={module.name}
      subtitle="Modulo habilitado por la plantilla de tu industria."
    >
      <Card className="p-8 text-center">
        <span className="material-symbols-outlined text-6xl text-primary">
          {module.icon || "extension"}
        </span>
        <h2 className="mt-4 text-2xl font-bold">{module.name}</h2>
        <p className="mx-auto mt-3 max-w-xl text-on-surface-variant">
          La navegacion, los permisos y la activacion ya funcionan mediante el
          motor modular. Las operaciones especializadas se incorporaran en la
          siguiente entrega vertical.
        </p>
      </Card>
    </DashboardShell>
  );
}
