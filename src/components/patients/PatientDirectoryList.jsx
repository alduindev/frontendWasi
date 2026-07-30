import Card from "../atoms/Card";

function isPatientActive(patient) {
  return patient.isActive !== false && patient.status !== "inactive";
}

function PatientStatus({ patient }) {
  const active = isPatientActive(patient);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
        active
          ? "bg-emerald-50 text-emerald-800"
          : "bg-error-container text-on-error-container"
      }`}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function PatientIdentity({ patient }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-fixed text-xs font-bold text-primary">
        {patient.firstName?.[0]}
        {patient.lastName?.[0]}
      </span>
      <span className="min-w-0">
        <b className="block truncate">
          {patient.lastName}, {patient.firstName}
        </b>
        <span className="block truncate text-xs text-on-surface-variant">
          {patient.documentType} {patient.document}
        </span>
      </span>
    </div>
  );
}

function PatientAlert({ patient, mobile = false }) {
  const hasAllergies = Boolean(patient.allergies);
  const details = hasAllergies
    ? `Alergias: ${patient.allergies}`
    : "Sin alergias registradas";

  if (mobile) {
    return (
      <p
        className={`flex min-w-0 items-center gap-1.5 font-medium ${
          hasAllergies ? "text-amber-900" : "text-on-surface-variant"
        }`}
        title={details}
      >
        <span aria-hidden="true" className="material-symbols-outlined shrink-0 text-base">
          {hasAllergies ? "warning" : "verified"}
        </span>
        <span className="truncate">
          {hasAllergies ? "Alergias registradas" : "Sin alergias registradas"}
        </span>
      </p>
    );
  }

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
        hasAllergies
          ? "bg-amber-50 text-amber-900"
          : "bg-surface-container-low text-on-surface-variant"
      }`}
      title={details}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-base">
        {hasAllergies ? "warning" : "verified"}
      </span>
      <span className="truncate">
        {hasAllergies ? "Alergias registradas" : "Sin alergias"}
      </span>
    </span>
  );
}

function OpenRecordButton({ actionIcon, actionLabel, onOpen, patient }) {
  return (
    <button
      aria-label={`Abrir expediente de ${patient.firstName} ${patient.lastName}`}
      className="inline-flex min-h-9 min-w-[138px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30"
      onClick={() => onOpen(patient)}
      type="button"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-lg">
        {actionIcon}
      </span>
      {actionLabel}
    </button>
  );
}

export function PatientDirectoryPagination({
  onPageChange,
  page,
  pageSize,
  total,
}) {
  if (!total) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-on-surface-variant">
        Mostrando <b className="text-on-surface">{rangeStart}–{rangeEnd}</b> de{" "}
        <b className="text-on-surface">{total}</b> pacientes
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-surface-container-low px-2.5 text-sm font-bold text-on-surface-variant"
          title="Se ajusta automáticamente al tamaño de la ventana"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-base">
            view_list
          </span>
          {pageSize} por página
        </span>
        <button
          aria-label="Página anterior"
          className="grid size-9 place-items-center rounded-lg border border-outline-variant text-on-surface-variant transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            chevron_left
          </span>
        </button>
        <span aria-live="polite" className="min-w-24 text-center font-bold">
          Página {currentPage} de {totalPages}
        </span>
        <button
          aria-label="Página siguiente"
          className="grid size-9 place-items-center rounded-lg border border-outline-variant text-on-surface-variant transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Shared responsive directory used by clinical modules. Each workspace keeps
 * ownership of permissions and actions, while this component owns the layout.
 */
export default function PatientDirectoryList({
  actionContent,
  actionIcon = "clinical_notes",
  actionLabel = "Expediente",
  onOpen,
  patients,
}) {
  const actions = (patient) => actionContent?.(patient);

  return (
    <>
      <Card className="hidden overflow-visible xl:block">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead className="border-b border-outline-variant text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            <tr>
              <th className="w-[27%] px-4 py-3">Paciente</th>
              <th className="w-[23%] px-4 py-3">Contacto</th>
              <th className="w-[18%] px-4 py-3">Alertas</th>
              <th className="w-[13%] px-4 py-3">Estado</th>
              <th className="w-[19%] px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {patients.map((patient) => (
              <tr className="transition hover:bg-surface-container-low/70" key={patient.id}>
                <td className="px-4 py-3">
                  <PatientIdentity patient={patient} />
                </td>
                <td className="px-4 py-3 text-xs text-on-surface-variant">
                  <p className="truncate">{patient.phone || "Sin teléfono"}</p>
                  <p className="mt-1 truncate" title={patient.email || "Sin correo"}>
                    {patient.email || "Sin correo"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <PatientAlert patient={patient} />
                </td>
                <td className="px-4 py-3">
                  <PatientStatus patient={patient} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <OpenRecordButton
                      actionIcon={actionIcon}
                      actionLabel={actionLabel}
                      onOpen={onOpen}
                      patient={patient}
                    />
                    {actions(patient)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid gap-3 xl:hidden">
        {patients.map((patient) => (
          <Card className="overflow-visible p-4" key={patient.id}>
            <div className="flex min-w-0 items-start justify-between gap-3">
              <PatientIdentity patient={patient} />
              <div className="flex shrink-0 items-center gap-2">
                <PatientStatus patient={patient} />
                {actions(patient)}
              </div>
            </div>
            <div className="mt-3 grid gap-1 border-y border-outline-variant py-3 text-sm">
              <p className="truncate text-on-surface-variant">
                {patient.phone || "Sin teléfono"} · {patient.email || "Sin correo"}
              </p>
              <PatientAlert mobile patient={patient} />
            </div>
            <button
              className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-bold text-primary transition hover:bg-primary-fixed/50 hover:px-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              onClick={() => onOpen(patient)}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                {actionIcon}
              </span>
              Abrir expediente
            </button>
          </Card>
        ))}
      </div>
    </>
  );
}
