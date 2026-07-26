import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import * as api from "../../services/healthService";
import OperatorShell from "../../components/operator/OperatorShell";
import EntitySearchSelect from "../../components/ui/EntitySearchSelect";
const cls = "min-h-11 rounded-xl border border-outline-variant bg-surface px-3";
const titles = {
  "dental-records": "Historia clínica dental",
  "dental-catalog": "Catálogo de procedimientos",
  "dental-billing": "Cobros dentales",
  "dental-reports": "Reportes dentales",
};
export default function DentalOperations({ operator = false }) {
  const { moduleKey } = useParams();
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState("");
  const [report, setReport] = useState(null);
  const load = useCallback(async () => {
    const ps = patients.length ? patients : await api.getPatients();
    if (!patients.length) setPatients(ps);
    const id = patientId || ps[0]?.id || "";
    if (!patientId && id) setPatientId(id);
    if (moduleKey === "dental-records" && id) {
      const values = await Promise.all([
        api.getDentalClinicalEntries(id),
        api.getDentalPrescriptions(id),
        api.getDentalDocuments(id),
      ]);
      setRows(values.flat());
    } else if (moduleKey === "dental-catalog")
      setRows(await api.getDentalProcedures());
    else if (moduleKey === "dental-billing" && id)
      setRows(await api.getDentalPayments(id));
    else if (moduleKey === "dental-reports")
      setReport(await api.getDentalReport());
  }, [moduleKey, patientId, patients]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      v = (n) => f.get(n);
    if (modal === "entry")
      await api.createDentalClinicalEntry({
        patientId,
        entryType: v("entryType"),
        title: v("title"),
        content: v("content"),
        professionalName: v("professionalName"),
        vitalSigns: { bloodPressure: v("bloodPressure") },
      });
    if (modal === "prescription")
      await api.createDentalPrescription({
        patientId,
        medication: v("medication"),
        dose: v("dose"),
        frequency: v("frequency"),
        duration: v("duration"),
        instructions: v("instructions"),
        professionalName: v("professionalName"),
      });
    if (modal === "document")
      await api.createDentalDocument({
        patientId,
        documentType: v("documentType"),
        name: v("name"),
        url: v("url"),
        notes: v("notes"),
      });
    if (modal === "procedure")
      await api.createDentalProcedure({
        code: v("code").toUpperCase(),
        name: v("name"),
        category: v("category") || "General",
        price: Number(v("price")),
        durationMinutes: Number(v("durationMinutes")),
      });
    if (modal === "payment")
      await api.createDentalPayment({
        patientId,
        treatmentId: null,
        amount: Number(v("amount")),
        paymentMethod: v("paymentMethod"),
        reference: v("reference"),
        notes: v("notes"),
      });
    setModal("");
    load();
  };
  const primary =
    moduleKey === "dental-records"
      ? "entry"
      : moduleKey === "dental-catalog"
        ? "procedure"
        : "payment";
  const Shell = operator ? OperatorShell : DashboardShell;
  return (
    <Shell
      title={titles[moduleKey]}
      subtitle="Operación odontológica conectada al expediente."
      action={
        moduleKey === "dental-reports" ? null : (
          <Button
            disabled={moduleKey !== "dental-catalog" && !patientId}
            onClick={() => setModal(primary)}
          >
            Nuevo registro
          </Button>
        )
      }
    >
      {!["dental-catalog", "dental-reports"].includes(moduleKey) ? (
        <Card className="mb-4 p-4">
          <EntitySearchSelect
            getLabel={(x) => `${x.lastName}, ${x.firstName}`}
            getMeta={(x) => [x.document, x.phone].filter(Boolean).join(" · ")}
            getSearchValues={(x) => [
              x.firstName,
              x.lastName,
              `${x.firstName} ${x.lastName}`,
              x.document,
              x.phone,
              x.email,
            ]}
            items={patients}
            label="Paciente"
            onChange={setPatientId}
            placeholder="Buscar por nombre, DNI o celular"
            value={patientId}
          />
        </Card>
      ) : null}
      {moduleKey === "dental-records" ? (
        <div className="mb-4 flex gap-2">
          <Button onClick={() => setModal("entry")}>Evolución</Button>
          <Button onClick={() => setModal("prescription")}>Receta</Button>
          <Button onClick={() => setModal("document")}>Documento</Button>
        </div>
      ) : null}
      {report ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(report).map(([k, v]) => (
            <Card className="p-4" key={k}>
              <p>{k}</p>
              <b className="text-2xl">
                {typeof v === "number" ? v.toFixed(2) : v}
              </b>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((x) => (
            <Card className="p-4" key={x.id}>
              <b>
                {x.title ||
                  x.medication ||
                  x.name ||
                  x.procedure ||
                  `${x.paymentMethod}: S/ ${x.amount}`}
              </b>
              <p className="text-sm text-on-surface-variant">
                {x.content ||
                  x.instructions ||
                  x.category ||
                  x.reference ||
                  x.documentType}
              </p>
            </Card>
          ))}
        </div>
      )}
      {modal ? (
        <Modal onClose={() => setModal("")} title="Registro dental">
          <form className="grid gap-3 p-5 sm:grid-cols-2" onSubmit={submit}>
            {modal === "entry" ? (
              <>
                <select className={cls} name="entryType">
                  <option value="history">Historia</option>
                  <option value="evolution">Evolución</option>
                  <option value="examination">Examen</option>
                  <option value="consent">Consentimiento</option>
                </select>
                <input
                  className={cls}
                  name="title"
                  placeholder="Título"
                  required
                />
                <input
                  className={cls}
                  name="professionalName"
                  placeholder="Odontólogo"
                />
                <input
                  className={cls}
                  name="bloodPressure"
                  placeholder="Presión arterial"
                />
                <textarea
                  className={cls}
                  name="content"
                  placeholder="Detalle clínico"
                  required
                />
              </>
            ) : null}
            {modal === "prescription" ? (
              <>
                <input
                  className={cls}
                  name="medication"
                  placeholder="Medicamento"
                  required
                />
                <input className={cls} name="dose" placeholder="Dosis" />
                <input
                  className={cls}
                  name="frequency"
                  placeholder="Frecuencia"
                />
                <input className={cls} name="duration" placeholder="Duración" />
                <input
                  className={cls}
                  name="professionalName"
                  placeholder="Odontólogo"
                />
                <textarea
                  className={cls}
                  name="instructions"
                  placeholder="Indicaciones"
                />
              </>
            ) : null}
            {modal === "document" ? (
              <>
                <select className={cls} name="documentType">
                  <option value="radiograph">Radiografía</option>
                  <option value="photo">Fotografía</option>
                  <option value="consent">Consentimiento</option>
                  <option value="other">Otro</option>
                </select>
                <input
                  className={cls}
                  name="name"
                  placeholder="Nombre"
                  required
                />
                <input
                  className={cls}
                  name="url"
                  placeholder="URL segura"
                  required
                />
                <textarea className={cls} name="notes" placeholder="Notas" />
              </>
            ) : null}
            {modal === "procedure" ? (
              <>
                <input
                  className={cls}
                  name="code"
                  placeholder="Código"
                  required
                />
                <input
                  className={cls}
                  name="name"
                  placeholder="Procedimiento"
                  required
                />
                <input
                  className={cls}
                  name="category"
                  placeholder="Categoría"
                />
                <input className={cls} name="price" type="number" min="0" />
                <input
                  className={cls}
                  name="durationMinutes"
                  type="number"
                  defaultValue="30"
                />
              </>
            ) : null}
            {modal === "payment" ? (
              <>
                <input
                  className={cls}
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                />
                <select className={cls} name="paymentMethod">
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                  <option value="yape">Yape</option>
                </select>
                <input
                  className={cls}
                  name="reference"
                  placeholder="Referencia"
                />
                <textarea className={cls} name="notes" placeholder="Notas" />
              </>
            ) : null}
            <Button type="submit">Guardar</Button>
          </form>
        </Modal>
      ) : null}
    </Shell>
  );
}
