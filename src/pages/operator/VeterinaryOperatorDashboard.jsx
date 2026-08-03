import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import OperatorShell from "../../components/operator/OperatorShell";
import { useAppConfig } from "../../context/appConfigStore";
import { useAuth } from "../../context/authStore";
import * as api from "../../services/veterinaryService";
import VeterinaryAttentionForm from "../veterinary/VeterinaryAttentionForm";
import { matchesEntitySearch } from "../../utils/entitySearch";
const field =
  "min-h-11 w-full rounded-xl border border-outline-variant px-3 outline-none focus:border-primary";
const species = {
  dog: "Perro",
  cat: "Gato",
  bird: "Ave",
  rabbit: "Conejo",
  other: "Otra",
};
function Record({ canAttend, data, onClose, onAttention }) {
  const [tab, setTab] = useState("history");
  return (
    <Modal
      dialogClassName="sm:max-w-4xl"
      onClose={onClose}
      title={`Expediente · ${data.pet.name}`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-primary-fixed p-3">
          <span className="material-symbols-outlined grid size-12 place-items-center rounded-xl bg-primary text-white">
            pets
          </span>
          <div className="min-w-0 flex-1">
            <b>
              {data.pet.name} · {data.pet.breed || species[data.pet.species]}
            </b>
            <p className="text-sm">
              {data.pet.owner.name} · {data.pet.owner.phone}
            </p>
          </div>
          {canAttend ? <Button onClick={onAttention}>Atender</Button> : null}
        </div>
        <nav className="my-3 grid grid-cols-3 rounded-xl border p-1">
          {[
            ["history", "Historia"],
            ["vaccines", "Vacunas"],
            ["appointments", "Citas"],
          ].map((x) => (
            <button
              className={`rounded-lg py-2 text-sm font-bold ${tab === x[0] ? "bg-primary text-white" : ""}`}
              key={x[0]}
              onClick={() => setTab(x[0])}
              type="button"
            >
              {x[1]}
            </button>
          ))}
        </nav>
        <div className="grid max-h-[48vh] gap-2 overflow-y-auto">
          {tab === "history"
            ? data.records.map((x) => (
                <Card className="p-3" key={x.id}>
                  <b>{x.diagnosis || "Atención clínica"}</b>
                  <p className="text-sm">{x.treatment}</p>
                  {x.supplies?.length ? (
                    <p className="mt-2 text-xs text-primary">
                      <b>Inventario:</b>{" "}
                      {x.supplies
                        .map((supply) => `${supply.quantity} × ${supply.product.name}`)
                        .join(", ")}
                    </p>
                  ) : null}
                  <small>
                    {new Date(x.createdAt).toLocaleString("es-PE")} ·{" "}
                    {x.professional?.name || "Equipo veterinario"}
                  </small>
                </Card>
              ))
            : null}
          {tab === "vaccines"
            ? data.vaccines.map((x) => (
                <Card className="p-3" key={x.id}>
                  <b>{x.name}</b>
                  <p className="text-sm">
                    Aplicada {x.appliedAt} · Próxima{" "}
                    {x.nextDueAt || "sin fecha"}
                  </p>
                </Card>
              ))
            : null}
          {tab === "appointments"
            ? data.appointments.map((x) => (
                <Card className="p-3" key={x.id}>
                  <b>{x.reason}</b>
                  <p className="text-sm">
                    {new Date(x.startsAt).toLocaleString("es-PE")} · {x.status}
                  </p>
                </Card>
              ))
            : null}
        </div>
      </div>
    </Modal>
  );
}
export default function VeterinaryOperatorDashboard() {
  const { user } = useAuth();
  const { config } = useAppConfig();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const capabilities = useMemo(
    () => new Set(config?.capabilities || []),
    [config?.capabilities],
  );
  const functions = useMemo(
    () => new Set(config?.user?.functions?.map((item) => item.code) || []),
    [config?.user?.functions],
  );
  const canAttend =
    capabilities.has("pets.edit") &&
    (functions.has("veterinarian") || functions.has("veterinary-groomer"));
  const [pets, setPets] = useState([]),
    [appointments, setAppointments] = useState([]),
    [professionals, setProfessionals] = useState([]),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(null),
    [record, setRecord] = useState(null),
    [attention, setAttention] = useState(null),
    [query, setQuery] = useState("");
  const load = useCallback(async () => {
    try {
      const [p, a, pro] = await Promise.all([
        api.getPets(),
        api.getVeterinaryAppointments(),
        api.getVeterinaryProfessionals(),
      ]);
      setPets(p);
      setAppointments(a);
      setProfessionals(pro);
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  const focusedPetId = searchParams.get("pet");
  useEffect(() => {
    if (!focusedPetId) return undefined;
    const focusedPet = pets.find((pet) => pet.id === focusedPetId);
    if (!focusedPet) return undefined;
    let active = true;
    api
      .getPetRecord(focusedPetId)
      .then((data) => {
        if (!active) return;
        setSelected(focusedPet);
        setRecord(data);
        navigate("/pos/veterinary/pets", { replace: true });
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "No se pudo abrir el expediente de la mascota.");
      });
    return () => {
      active = false;
    };
  }, [focusedPetId, navigate, pets]);
  const today = new Date().toLocaleDateString("en-CA");
  const todayItems = appointments.filter(
    (x) => x.startsAt?.slice(0, 10) === today,
  );
  const visible = useMemo(
    () =>
      pets.filter((x) =>
        matchesEntitySearch(x, query, (item) => [
          item.name,
          item.code,
          item.owner?.name,
          item.owner?.document,
          item.owner?.phone,
          item.owner?.email,
        ]),
      ),
    [pets, query],
  );
  const open = async (pet) => {
    setSelected(pet);
    try {
      setRecord(await api.getPetRecord(pet.id));
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <OperatorShell
      subtitle="Consulta expedientes asignados y registra la evolución de cada mascota."
      title={`Hola, ${user.name}`}
    >
      {error ? (
        <EmptyState
          icon="cloud_off"
          title="No se pudo cargar"
          description={error}
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <span className="material-symbols-outlined text-primary">
            calendar_month
          </span>
          <b className="mt-2 block text-3xl">{todayItems.length}</b>
          <p className="text-sm">Citas de hoy</p>
        </Card>
        <Card className="p-4">
          <span className="material-symbols-outlined text-primary">pets</span>
          <b className="mt-2 block text-3xl">{pets.length}</b>
          <p className="text-sm">Mascotas disponibles</p>
        </Card>
        <Card className="p-4">
          <span className="material-symbols-outlined text-primary">
            vaccines
          </span>
          <b className="mt-2 block text-3xl">
            {
              todayItems.filter((x) => x.reason.toLowerCase().includes("vacun"))
                .length
            }
          </b>
          <p className="text-sm">Vacunaciones hoy</p>
        </Card>
      </div>
      <Card className="mt-3 p-3">
        <h2 className="font-bold">Mi agenda de hoy</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {todayItems.map((x) => (
            <button
              className="rounded-xl bg-surface-container-low p-3 text-left hover:bg-primary-fixed"
              key={x.id}
              onClick={() => open(x.pet)}
              type="button"
            >
              <b>
                {new Date(x.startsAt).toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {x.pet.name}
              </b>
              <p className="text-sm">
                {x.reason} · {x.pet.owner.name}
              </p>
            </button>
          ))}
          {!todayItems.length ? (
            <p className="text-sm text-on-surface-variant">
              Sin citas programadas para hoy.
            </p>
          ) : null}
        </div>
      </Card>
      <div className="mt-3">
        <input
          className={field}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar mascota, propietario, DNI o celular"
          value={query}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.slice(0, 9).map((x) => (
            <button
              className="text-left"
              key={x.id}
              onClick={() => open(x)}
              type="button"
            >
              <Card className="p-3 hover:border-primary">
                <b>
                  {x.name} · {x.breed || species[x.species]}
                </b>
                <p className="text-sm">
                  {x.owner.name} · {x.code}
                </p>
                {x.allergies ? (
                  <p className="mt-2 rounded-lg bg-error-container px-2 py-1 text-xs">
                    Alergias: {x.allergies}
                  </p>
                ) : null}
              </Card>
            </button>
          ))}
        </div>
      </div>
      {record && selected ? (
        <Record
          canAttend={canAttend}
          data={record}
          onAttention={canAttend ? () => {
            setRecord(null);
            setAttention(selected);
          } : undefined}
          onClose={() => {
            setRecord(null);
            setSelected(null);
          }}
        />
      ) : null}
      {attention && canAttend ? (
        <VeterinaryAttentionForm
          appointments={appointments}
          onClose={() => setAttention(null)}
          onSaved={() => {
            setAttention(null);
            load();
          }}
          pet={attention}
          professionals={professionals}
        />
      ) : null}
    </OperatorShell>
  );
}
