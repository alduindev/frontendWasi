import { useEffect, useState } from "react";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import Select from "../../components/atoms/Select";
import DashboardShell from "../../components/organisms/DashboardShell";
import { useToast } from "../../hooks/useToast";
import {
  defaultSettings,
  getSettings,
  saveSettings,
} from "../../services/settingsService";
import { useOnboarding } from "../../context/onboardingStore";
import { getBusinessTypes } from "../../services/businessTypeService";
import { getMyBusiness } from "../../services/businessService";

function ToggleSetting({ checked, label, onChange, supportingText }) {
  return (
    <button
      aria-pressed={checked}
      className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition ${checked ? "border-primary bg-primary-container text-on-primary-container" : "border-outline-variant bg-white text-on-surface hover:border-primary"}`}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        <span className="mt-1 block text-xs opacity-75">{supportingText}</span>
      </span>
      <span
        className={`flex h-6 w-11 items-center rounded-full p-1 transition ${checked ? "bg-primary" : "bg-outline-variant"}`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`}
        />
      </span>
    </button>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(() => getSettings());
  const { showToast } = useToast();
  const { restartOnboarding } = useOnboarding();
  const [business, setBusiness] = useState(null);
  const [businessTypes, setBusinessTypes] = useState([]);
  useEffect(() => {
    Promise.all([getMyBusiness(), getBusinessTypes()])
      .then(([company, types]) => {
        setBusiness(company);
        setBusinessTypes(types);
      })
      .catch(() => {});
  }, []);
  const update = (key, value) =>
    setSettings((current) => ({ ...current, [key]: value }));
  const handleSubmit = (event) => {
    event.preventDefault();
    setSettings(saveSettings(settings));
    showToast({ title: "Configuracion guardada", tone: "success" });
  };
  const resetSettings = () => {
    setSettings(saveSettings(defaultSettings));
    showToast({ title: "Configuracion restablecida", tone: "info" });
  };

  return (
    <DashboardShell
      subtitle="Controla preferencias regionales y comportamiento general de Wasita."
      title="Configuracion"
    >
      <form
        className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-5">
          {business ? (
            <Card className="p-4 sm:p-5">
              <div className="mb-4">
                <h2 className="font-heading text-xl font-bold">
                  Tipo de negocio
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  La industria se define durante el registro y determina los
                  módulos y datos de {business.name}.
                </p>
              </div>
              {businessTypes.find(
                (type) => type.id === business.businessTypeId,
              ) ? (
                <div className="flex gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                  <span className="material-symbols-outlined text-3xl text-primary">
                    {
                      businessTypes.find(
                        (type) => type.id === business.businessTypeId,
                      ).icon
                    }
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <b>
                        {
                          businessTypes.find(
                            (type) => type.id === business.businessTypeId,
                          ).name
                        }
                      </b>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-bold">
                        Solo lectura
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {
                        businessTypes.find(
                          (type) => type.id === business.businessTypeId,
                        ).description
                      }
                    </p>
                    <p className="mt-2 text-xs font-semibold text-on-surface-variant">
                      Para solicitar una migración compatible, contacta al
                      soporte de Wasita.
                    </p>
                  </div>
                </div>
              ) : null}
            </Card>
          ) : null}
          <Card className="p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="font-heading text-xl font-bold text-on-surface">
                Preferencias regionales
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Configura los formatos usados en la aplicacion.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Moneda"
                onChange={(event) => update("currency", event.target.value)}
                value={settings.currency}
              >
                <option value="PEN">PEN - Sol peruano</option>
                <option value="USD">USD - Dolar</option>
                <option value="EUR">EUR - Euro</option>
              </Select>
              <Select
                label="Idioma"
                onChange={(event) => update("language", event.target.value)}
                value={settings.language}
              >
                <option value="es">Espanol</option>
                <option value="en">English</option>
                <option value="pt">Portugues</option>
              </Select>
              <Select
                label="Formato de fecha"
                onChange={(event) => update("dateFormat", event.target.value)}
                value={settings.dateFormat}
              >
                <option value="dd/MM/yyyy">dd/MM/yyyy</option>
                <option value="MM/dd/yyyy">MM/dd/yyyy</option>
                <option value="yyyy-MM-dd">yyyy-MM-dd</option>
              </Select>
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="font-heading text-xl font-bold text-on-surface">
                Comportamiento
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Ajustes de seguridad visual y movimiento.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <ToggleSetting
                checked={settings.confirmations}
                label="Mostrar confirmaciones"
                onChange={(value) => update("confirmations", value)}
                supportingText="Confirma antes de acciones destructivas."
              />
              <ToggleSetting
                checked={settings.animations}
                label="Activar animaciones"
                onChange={(value) => update("animations", value)}
                supportingText="Mantiene transiciones suaves en la interfaz."
              />
            </div>
          </Card>
        </div>
        <aside className="grid h-max gap-3 xl:sticky xl:top-24">
          <Card className="p-5">
            <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
              light_mode
            </span>
            <h2 className="mt-4 font-heading text-xl font-bold">
              Diseño claro
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Wasita utiliza un unico tema claro, consistente y optimizado para
              el trabajo diario.
            </p>
          </Card>
          <Card className="p-5" data-tour="restart-tutorial">
            <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed">
              school
            </span>
            <h2 className="mt-4 font-heading text-xl font-bold">
              Tutorial de primer uso
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Vuelve a recorrer las funciones principales cuando lo necesites.
            </p>
            <Button
              className="mt-4 w-full"
              icon="play_circle"
              onClick={restartOnboarding}
              type="button"
              variant="secondary"
            >
              Iniciar tutorial
            </Button>
          </Card>
          <div className="grid gap-2 rounded-2xl border border-outline-variant bg-white p-3">
            <Button icon="save" type="submit">
              Guardar cambios
            </Button>
            <Button
              icon="restart_alt"
              onClick={resetSettings}
              type="button"
              variant="secondary"
            >
              Restablecer
            </Button>
          </div>
        </aside>
      </form>
    </DashboardShell>
  );
}
