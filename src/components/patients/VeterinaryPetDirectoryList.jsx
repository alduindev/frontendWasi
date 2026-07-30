import Card from "../atoms/Card";

const speciesLabels = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Conejo",
  other: "Otra especie",
};

const sexLabels = {
  female: "Hembra",
  male: "Macho",
  unknown: "Sin especificar",
};

function petAge(birthDate) {
  if (!birthDate) return "Edad no registrada";
  const birth = new Date(`${birthDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return "Edad no registrada";
  const months = Math.max(
    0,
    (new Date().getFullYear() - birth.getFullYear()) * 12 +
      new Date().getMonth() -
      birth.getMonth(),
  );
  if (months < 12) return `${months} mes${months === 1 ? "" : "es"}`;
  const years = Math.floor(months / 12);
  return `${years} año${years === 1 ? "" : "s"}`;
}

function PetAvatar({ pet }) {
  if (pet.photoUrl)
    return (
      <img
        alt={`Foto de ${pet.name}`}
        className="size-10 shrink-0 rounded-full object-cover"
        src={pet.photoUrl}
      />
    );
  return (
    <span className="material-symbols-outlined grid size-10 shrink-0 place-items-center rounded-full bg-primary-fixed text-primary">
      pets
    </span>
  );
}

function PetIdentity({ pet }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <PetAvatar pet={pet} />
      <span className="min-w-0">
        <b className="block truncate">{pet.name}</b>
        <span className="block truncate text-xs text-on-surface-variant">
          {pet.code} · {pet.breed || speciesLabels[pet.species] || pet.species}
        </span>
      </span>
    </div>
  );
}

function PetStatus({ pet }) {
  const status = pet.status || "active";
  const styles = {
    active: "bg-emerald-50 text-emerald-800",
    inactive: "bg-error-container text-on-error-container",
    deceased: "bg-surface-container-high text-on-surface-variant",
  };
  const labels = {
    active: "Activa",
    inactive: "Inactiva",
    deceased: "Fallecida",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[status] || styles.inactive}`}>
      {labels[status] || status}
    </span>
  );
}

function PetClinicalDetails({ pet, mobile = false }) {
  const details = [
    pet.species ? speciesLabels[pet.species] || pet.species : "Especie no registrada",
    sexLabels[pet.sex] || "Sexo no registrado",
    pet.weightKg ? `${pet.weightKg} kg` : "Peso no registrado",
    petAge(pet.birthDate),
  ];
  return (
    <p className={`min-w-0 ${mobile ? "text-sm" : "text-xs"} text-on-surface-variant`}>
      {details.join(" · ")}
      {pet.microchip ? <span className="block truncate">Microchip: {pet.microchip}</span> : null}
    </p>
  );
}

function PetAlerts({ pet, mobile = false }) {
  const hasAllergies = Boolean(pet.allergies);
  const hasConditions = Boolean(pet.conditions);
  if (mobile)
    return (
      <div className="grid gap-1 text-sm">
        <p className={hasAllergies ? "flex items-center gap-1.5 text-amber-900" : "flex items-center gap-1.5 text-on-surface-variant"} title={pet.allergies || "Sin alergias registradas"}>
          <span aria-hidden="true" className="material-symbols-outlined text-base">{hasAllergies ? "warning" : "verified"}</span>
          <span className="truncate">{hasAllergies ? `Alergias: ${pet.allergies}` : "Sin alergias registradas"}</span>
        </p>
        {hasConditions ? <p className="truncate text-on-surface-variant" title={pet.conditions}>Antecedentes: {pet.conditions}</p> : null}
      </div>
    );
  return (
    <div className="grid gap-1.5">
      <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${hasAllergies ? "bg-amber-50 text-amber-900" : "bg-surface-container-low text-on-surface-variant"}`} title={pet.allergies || "Sin alergias registradas"}>
        <span aria-hidden="true" className="material-symbols-outlined text-base">{hasAllergies ? "warning" : "verified"}</span>
        <span className="truncate">{hasAllergies ? "Alergias registradas" : "Sin alergias"}</span>
      </span>
      {hasConditions ? <span className="truncate text-xs text-on-surface-variant" title={pet.conditions}>Antecedentes: {pet.conditions}</span> : null}
    </div>
  );
}

function OpenRecordButton({ onOpen, pet }) {
  return (
    <button
      aria-label={`Abrir expediente de ${pet.name}`}
      className="inline-flex min-h-9 min-w-[138px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30"
      onClick={() => onOpen(pet)}
      type="button"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-lg">clinical_notes</span>
      Expediente
    </button>
  );
}

export default function VeterinaryPetDirectoryList({
  actionContent,
  onOpen,
  pets,
}) {
  const actions = (pet) => actionContent?.(pet);

  return (
    <>
      <Card className="hidden overflow-visible xl:block">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead className="border-b border-outline-variant text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            <tr>
              <th className="w-[24%] px-4 py-3">Mascota</th>
              <th className="w-[20%] px-4 py-3">Propietario</th>
              <th className="w-[20%] px-4 py-3">Datos clínicos</th>
              <th className="w-[17%] px-4 py-3">Alertas</th>
              <th className="w-[10%] px-4 py-3">Estado</th>
              <th className="w-[19%] px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {pets.map((pet) => (
              <tr className="transition hover:bg-surface-container-low/70" key={pet.id}>
                <td className="px-4 py-3"><PetIdentity pet={pet} /></td>
                <td className="px-4 py-3 text-xs text-on-surface-variant">
                  <p className="truncate font-bold text-on-surface">{pet.owner?.name || "Sin propietario"}</p>
                  <p className="mt-1 truncate">{pet.owner?.phone || "Sin teléfono"}</p>
                  <p className="mt-1 truncate">DNI {pet.owner?.document || "—"}</p>
                </td>
                <td className="px-4 py-3"><PetClinicalDetails pet={pet} /></td>
                <td className="px-4 py-3"><PetAlerts pet={pet} /></td>
                <td className="px-4 py-3"><PetStatus pet={pet} /></td>
                <td className="px-4 py-3"><div className="flex justify-end gap-2"><OpenRecordButton onOpen={onOpen} pet={pet} />{actions(pet)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="grid gap-3 xl:hidden">
        {pets.map((pet) => (
          <Card className="overflow-visible p-4" key={pet.id}>
            <div className="flex min-w-0 items-start justify-between gap-3">
              <PetIdentity pet={pet} />
              <div className="flex shrink-0 items-center gap-2"><PetStatus pet={pet} />{actions(pet)}</div>
            </div>
            <div className="mt-3 grid gap-2 border-y border-outline-variant py-3">
              <p className="truncate text-sm text-on-surface-variant">{pet.owner?.name || "Sin propietario"} · {pet.owner?.phone || "Sin teléfono"}</p>
              <PetClinicalDetails mobile pet={pet} />
              <PetAlerts mobile pet={pet} />
            </div>
            <button className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-bold text-primary transition hover:bg-primary-fixed/50 hover:px-2 focus:outline-none focus:ring-2 focus:ring-primary/30" onClick={() => onOpen(pet)} type="button"><span aria-hidden="true" className="material-symbols-outlined text-xl">clinical_notes</span>Abrir expediente</button>
          </Card>
        ))}
      </div>
    </>
  );
}