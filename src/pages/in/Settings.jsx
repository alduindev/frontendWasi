import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import Input from "../../components/atoms/Input";
import Select from "../../components/atoms/Select";
import DashboardShell from "../../components/organisms/DashboardShell";
import { useAppConfig } from "../../context/appConfigStore";
import { useOnboarding } from "../../context/onboardingStore";
import { useToast } from "../../hooks/useToast";
import { getBusinessTypes } from "../../services/businessTypeService";
import {
  getMyBusiness,
  updateMyBusiness,
} from "../../services/businessService";
import {
  defaultSettings,
  getSettings,
  saveSettings,
} from "../../services/settingsService";

const TIMEZONES = [
  ["America/Lima", "Lima (UTC-5)"],
  ["America/Bogota", "Bogotá (UTC-5)"],
  ["America/Guayaquil", "Guayaquil (UTC-5)"],
  ["America/Mexico_City", "Ciudad de México"],
  ["America/Santiago", "Santiago"],
  ["America/Argentina/Buenos_Aires", "Buenos Aires"],
  ["UTC", "UTC"],
];

function businessForm(value) {
  return {
    address: value?.address || "",
    country: value?.country || "PE",
    currency: value?.currency || "PEN",
    email: value?.email || "",
    employeeCount: value?.employeeCount || 1,
    legalName: value?.legalName || "",
    name: value?.name || "",
    phone: value?.phone || "",
    taxDocument: value?.taxDocument || "",
    timezone: value?.timezone || "America/Lima",
  };
}

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

function SettingsTabs({ activeTab, onChange }) {
  return (
    <div
      aria-label="Secciones de configuración"
      className="grid grid-cols-2 gap-1 rounded-2xl border border-outline-variant bg-white p-1"
      role="tablist"
    >
      {[
        ["business", "domain", "Empresa"],
        ["preferences", "tune", "Preferencias"],
      ].map(([id, icon, label]) => (
        <button
          aria-selected={activeTab === id}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${activeTab === id ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-surface-container-low"}`}
          key={id}
          onClick={() => onChange(id)}
          role="tab"
          type="button"
        >
          <span className="material-symbols-outlined text-xl">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("business");
  const [business, setBusiness] = useState(null);
  const [businessDraft, setBusinessDraft] = useState(() => businessForm());
  const [businessError, setBusinessError] = useState("");
  const [businessLoading, setBusinessLoading] = useState(true);
  const [businessTypes, setBusinessTypes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(() => getSettings());
  const { refresh } = useAppConfig();
  const { restartOnboarding } = useOnboarding();
  const { showToast } = useToast();

  const loadBusiness = useCallback(async () => {
    setBusinessLoading(true);
    setBusinessError("");
    try {
      const [company, types] = await Promise.all([
        getMyBusiness(),
        getBusinessTypes(),
      ]);
      setBusiness(company);
      setBusinessDraft(businessForm(company));
      setBusinessTypes(types);
    } catch (error) {
      setBusinessError(error.message);
    } finally {
      setBusinessLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(loadBusiness);
  }, [loadBusiness]);

  const selectedBusinessType = useMemo(
    () =>
      businessTypes.find((type) => type.id === business?.businessTypeId) ||
      null,
    [business?.businessTypeId, businessTypes],
  );

  const updateSetting = (key, value) =>
    setSettings((current) => ({ ...current, [key]: value }));
  const updateBusiness = (key, value) =>
    setBusinessDraft((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (activeTab === "business") {
        const payload = {
          ...businessDraft,
          address: businessDraft.address.trim(),
          email: businessDraft.email.trim().toLowerCase(),
          legalName: businessDraft.legalName.trim(),
          name: businessDraft.name.trim(),
          phone: businessDraft.phone.replace(/\D/g, ""),
          taxDocument: businessDraft.taxDocument.replace(/\D/g, ""),
        };
        if (business?.taxDocument) delete payload.taxDocument;
        const saved = await updateMyBusiness(payload);
        setBusiness(saved);
        setBusinessDraft(businessForm(saved));
        await refresh({ silent: true });
        showToast({
          title: "Datos de la empresa actualizados",
          message: "El nuevo nombre ya se usa en los módulos del negocio.",
          tone: "success",
        });
      } else {
        setSettings(saveSettings(settings));
        showToast({ title: "Preferencias guardadas", tone: "success" });
      }
    } catch (error) {
      showToast({
        title:
          activeTab === "business"
            ? "No se pudo actualizar la empresa"
            : "No se pudieron guardar las preferencias",
        message: error.message,
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetPreferences = () => {
    setSettings(saveSettings(defaultSettings));
    showToast({ title: "Preferencias restablecidas", tone: "info" });
  };

  return (
    <DashboardShell
      subtitle="Administra los datos del negocio y las preferencias generales de Wasita."
      title="Configuración"
    >
      <div className="grid gap-4">
        <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "business" && businessLoading ? (
          <Card className="grid min-h-48 place-items-center p-6 text-center">
            <div>
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">
                progress_activity
              </span>
              <p className="mt-2 text-sm text-on-surface-variant">
                Cargando datos de la empresa...
              </p>
            </div>
          </Card>
        ) : null}

        {activeTab === "business" && businessError ? (
          <Card className="grid min-h-48 place-items-center border-error/30 p-6 text-center">
            <div>
              <span className="material-symbols-outlined text-3xl text-error">
                domain_disabled
              </span>
              <h2 className="mt-2 font-bold">No se pudo cargar la empresa</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {businessError}
              </p>
              <Button
                className="mt-4"
                onClick={loadBusiness}
                type="button"
                variant="secondary"
              >
                Reintentar
              </Button>
            </div>
          </Card>
        ) : null}

        {activeTab !== "business" || (!businessLoading && !businessError) ? (
          <form
            className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-5">
              {activeTab === "business" && business ? (
                <>
                  <Card className="p-4 sm:p-5">
                    <div className="mb-4 flex items-start gap-3">
                      <span className="material-symbols-outlined flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
                        storefront
                      </span>
                      <div>
                        <h2 className="font-heading text-xl font-bold">
                          Datos del negocio
                        </h2>
                        <p className="mt-1 text-sm text-on-surface-variant">
                          Esta información identifica a tu empresa en paneles,
                          documentos y comunicaciones.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Nombre comercial"
                        maxLength="120"
                        minLength="2"
                        onChange={(event) =>
                          updateBusiness("name", event.target.value)
                        }
                        required
                        value={businessDraft.name}
                      />
                      <Input
                        label="Razón social"
                        maxLength="180"
                        onChange={(event) =>
                          updateBusiness("legalName", event.target.value)
                        }
                        placeholder="Nombre legal de la empresa"
                        value={businessDraft.legalName}
                      />
                      <Input
                        disabled={Boolean(business.taxDocument)}
                        inputMode="numeric"
                        label={
                          business.taxDocument
                            ? "RUC verificado"
                            : "RUC (registro único)"
                        }
                        maxLength="11"
                        minLength={businessDraft.taxDocument ? "11" : undefined}
                        onChange={(event) =>
                          updateBusiness(
                            "taxDocument",
                            event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 11),
                          )
                        }
                        pattern="[0-9]{11}"
                        placeholder="20123456789"
                        value={businessDraft.taxDocument}
                      />
                      <Input
                        label="Cantidad de trabajadores"
                        max="1000000"
                        min="1"
                        onChange={(event) =>
                          updateBusiness(
                            "employeeCount",
                            Number(event.target.value),
                          )
                        }
                        required
                        type="number"
                        value={businessDraft.employeeCount}
                      />
                      <Input
                        label="Correo del negocio"
                        maxLength="254"
                        onChange={(event) =>
                          updateBusiness("email", event.target.value)
                        }
                        required
                        type="email"
                        value={businessDraft.email}
                      />
                      <Input
                        inputMode="numeric"
                        label="Teléfono del negocio"
                        maxLength="15"
                        minLength="6"
                        onChange={(event) =>
                          updateBusiness(
                            "phone",
                            event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 15),
                          )
                        }
                        pattern="[0-9]{6,15}"
                        required
                        value={businessDraft.phone}
                      />
                      <Input
                        className="sm:col-span-2"
                        label="Dirección"
                        maxLength="240"
                        onChange={(event) =>
                          updateBusiness("address", event.target.value)
                        }
                        placeholder="Av., calle, número y distrito"
                        value={businessDraft.address}
                      />
                      <Select
                        label="País"
                        onChange={(event) =>
                          updateBusiness("country", event.target.value)
                        }
                        value={businessDraft.country}
                      >
                        <option value="PE">Perú</option>
                      </Select>
                      <Select
                        label="Moneda operativa"
                        onChange={(event) =>
                          updateBusiness("currency", event.target.value)
                        }
                        value={businessDraft.currency}
                      >
                        <option value="PEN">PEN - Sol peruano</option>
                        <option value="USD">USD - Dólar</option>
                        <option value="EUR">EUR - Euro</option>
                      </Select>
                      <Select
                        className="sm:col-span-2"
                        label="Zona horaria"
                        onChange={(event) =>
                          updateBusiness("timezone", event.target.value)
                        }
                        value={businessDraft.timezone}
                      >
                        {!TIMEZONES.some(
                          ([value]) => value === businessDraft.timezone,
                        ) ? (
                          <option value={businessDraft.timezone}>
                            {businessDraft.timezone}
                          </option>
                        ) : null}
                        {TIMEZONES.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="mt-4 flex gap-2 rounded-2xl bg-surface-container-low p-3 text-xs leading-5 text-on-surface-variant">
                      <span className="material-symbols-outlined text-lg text-primary">
                        verified_user
                      </span>
                      <p>
                        El RUC queda bloqueado después de registrarse. Un cambio
                        fiscal requiere validación de Wasita para proteger los
                        comprobantes y el historial.
                      </p>
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-5">
                    <div className="mb-4">
                      <h2 className="font-heading text-xl font-bold">
                        Rubro del negocio
                      </h2>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        El rubro determina los módulos, flujos y permisos
                        disponibles.
                      </p>
                    </div>
                    {selectedBusinessType ? (
                      <div className="flex gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                        <span className="material-symbols-outlined text-3xl text-primary">
                          {selectedBusinessType.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <b>{selectedBusinessType.name}</b>
                            <span className="rounded-full bg-white px-2 py-1 text-xs font-bold">
                              Cambio asistido
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-on-surface-variant">
                            {selectedBusinessType.description}
                          </p>
                          <p className="mt-2 text-xs font-semibold text-on-surface-variant">
                            Para cambiar de rubro sin perder información,
                            solicítalo al superadministrador de Wasita.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="rounded-2xl border border-dashed border-outline-variant p-4 text-sm text-on-surface-variant">
                        Rubro no identificado. Contacta al soporte de Wasita.
                      </p>
                    )}
                  </Card>
                </>
              ) : null}

              {activeTab === "preferences" ? (
                <>
                  <Card className="p-4 sm:p-5">
                    <div className="mb-4">
                      <h2 className="font-heading text-xl font-bold text-on-surface">
                        Preferencias regionales
                      </h2>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Configura los formatos usados en este dispositivo.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Select
                        label="Moneda visual"
                        onChange={(event) =>
                          updateSetting("currency", event.target.value)
                        }
                        value={settings.currency}
                      >
                        <option value="PEN">PEN - Sol peruano</option>
                        <option value="USD">USD - Dólar</option>
                        <option value="EUR">EUR - Euro</option>
                      </Select>
                      <Select
                        label="Idioma"
                        onChange={(event) =>
                          updateSetting("language", event.target.value)
                        }
                        value={settings.language}
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                        <option value="pt">Português</option>
                      </Select>
                      <Select
                        label="Formato de fecha"
                        onChange={(event) =>
                          updateSetting("dateFormat", event.target.value)
                        }
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
                        onChange={(value) =>
                          updateSetting("confirmations", value)
                        }
                        supportingText="Confirma antes de acciones destructivas."
                      />
                      <ToggleSetting
                        checked={settings.animations}
                        label="Activar animaciones"
                        onChange={(value) =>
                          updateSetting("animations", value)
                        }
                        supportingText="Mantiene transiciones suaves en la interfaz."
                      />
                    </div>
                  </Card>
                </>
              ) : null}
            </div>

            <aside className="grid h-max gap-3 xl:sticky xl:top-24">
              {activeTab === "business" ? (
                <Card className="p-5">
                  <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                    domain
                  </span>
                  <h2 className="mt-4 font-heading text-xl font-bold">
                    {businessDraft.name || "Tu empresa"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                    Los cambios se reflejarán en el dashboard, documentos y
                    módulos conectados.
                  </p>
                  <dl className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-on-surface-variant">Estado</dt>
                      <dd className="font-bold capitalize">
                        {business?.status}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-on-surface-variant">Rubro</dt>
                      <dd className="text-right font-bold">
                        {selectedBusinessType?.name || "Sin definir"}
                      </dd>
                    </div>
                  </dl>
                </Card>
              ) : (
                <>
                  <Card className="p-5">
                    <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                      light_mode
                    </span>
                    <h2 className="mt-4 font-heading text-xl font-bold">
                      Diseño claro
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                      Una interfaz consistente y optimizada para el trabajo
                      diario.
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
                      Vuelve a recorrer las funciones principales cuando lo
                      necesites.
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
                </>
              )}

              <div className="grid gap-2 rounded-2xl border border-outline-variant bg-white p-3">
                <Button disabled={saving} icon="save" type="submit">
                  {saving
                    ? "Guardando..."
                    : activeTab === "business"
                      ? "Guardar empresa"
                      : "Guardar preferencias"}
                </Button>
                {activeTab === "preferences" ? (
                  <Button
                    icon="restart_alt"
                    onClick={resetPreferences}
                    type="button"
                    variant="secondary"
                  >
                    Restablecer
                  </Button>
                ) : null}
              </div>
            </aside>
          </form>
        ) : null}
      </div>
    </DashboardShell>
  );
}
