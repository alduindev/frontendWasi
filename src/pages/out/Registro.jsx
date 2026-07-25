import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthButton from "../../components/molecules/AuthButton";
import AuthField from "../../components/molecules/AuthField";
import PasswordField from "../../components/molecules/PasswordField";
import AuthLayout from "../../components/organisms/AuthLayout";
import { useAuth } from "../../context/authStore";
import { getBusinessTypes } from "../../services/businessTypeService";
import { getPlans } from "../../services/platformService";

const field =
  "h-[52px] w-full rounded-2xl border border-outline-variant bg-white px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";
const money = (value, currency = "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(
    Number(value || 0),
  );
const priceOf = (plan, interval) =>
  plan?.prices?.find(
    (x) => x.billingInterval === interval && x.currency === "PEN",
  );

export default function Registro() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [types, setTypes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirmation: "",
    businessName: "",
    legalName: "",
    taxDocument: "",
    businessTypeId: "",
    country: "PE",
    currency: "PEN",
    employeeCount: "1",
    locationCount: "1",
    site: "Sede principal",
    address: "",
    planCode: params.get("plan") || "",
    billingInterval: params.get("billing") === "annual" ? "annual" : "monthly",
    accept: false,
  });
  useEffect(() => {
    Promise.all([getBusinessTypes(), getPlans()])
      .then(([businessTypes, availablePlans]) => {
        const selectable = availablePlans.filter((x) => !x.isCustom);
        setTypes(businessTypes);
        setPlans(selectable);
        setValues((current) => ({
          ...current,
          businessTypeId: current.businessTypeId || businessTypes[0]?.id || "",
          planCode: selectable.some((x) => x.code === current.planCode)
            ? current.planCode
            : selectable[0]?.code || "",
        }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const selected = useMemo(
    () => plans.find((x) => x.code === values.planCode),
    [plans, values.planCode],
  );
  const change = (e) =>
    setValues((v) => ({
      ...v,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  const next = (e) => {
    e?.preventDefault();
    setError("");
    if (step === 1 && values.password !== values.passwordConfirmation) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (
      step === 2 &&
      Number(values.locationCount) > Number(selected?.maxBranches || 1)
    ) {
      setError(
        `El plan seleccionado admite hasta ${selected?.maxBranches || 1} locales`,
      );
      return;
    }
    setStep((x) => Math.min(5, x + 1));
  };
  const submit = async () => {
    if (!values.accept) {
      setError("Debes aceptar los términos y la política de privacidad");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await register({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        businessName: values.businessName,
        legalName: values.legalName,
        taxDocument: values.taxDocument,
        businessTypeId: values.businessTypeId,
        country: values.country,
        currency: values.currency,
        employeeCount: Number(values.employeeCount),
        locationCount: Number(values.locationCount),
        site: values.site,
        address: values.address,
        planCode: values.planCode,
        billingInterval: values.billingInterval,
        timezone: "America/Lima",
      });
      navigate("/dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };
  const titles = [
    "Cuenta",
    "Negocio",
    "Plan",
    "Pago o prueba",
    "Configuración",
  ];
  return (
    <AuthLayout
      description="Registro guiado, plan configurable y módulos adecuados para tu tipo de negocio."
      eyebrow="Cuenta nueva"
      title="Configura Wasita a tu medida"
    >
      <div className="mb-5">
        <div className="flex gap-1.5">
          {titles.map((title, index) => (
            <button
              aria-label={`Ir a ${title}`}
              className={`h-1.5 flex-1 rounded-full ${step >= index + 1 ? "bg-primary" : "bg-outline-variant"}`}
              disabled={index + 1 > step}
              key={title}
              onClick={() => setStep(index + 1)}
              type="button"
            />
          ))}
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-primary">
          Paso {step} de 5 · {titles[step - 1]}
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold">
          {step === 1
            ? "Crea tu acceso"
            : step === 2
              ? "Cuéntanos sobre el negocio"
              : step === 3
                ? "Elige la capacidad"
                : step === 4
                  ? "Confirma tu prueba"
                  : "Revisa y activa tu espacio"}
        </h1>
      </div>
      {error ? (
        <p
          aria-live="polite"
          className="mb-4 rounded-xl bg-error-container p-3 text-sm font-bold text-on-error-container"
        >
          {error}
        </p>
      ) : null}
      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-surface-container" />
      ) : null}
      {!loading && step === 1 ? (
        <form autoComplete="off" className="grid gap-3" onSubmit={next}>
          <AuthField
            autoComplete="off"
            icon="person"
            id="name"
            label="Nombre completo"
            name="name"
            onChange={change}
            required
            value={values.name}
          />
          <AuthField
            autoComplete="off"
            icon="mail"
            id="email"
            label="Correo"
            name="email"
            onChange={change}
            required
            type="email"
            value={values.email}
          />
          <AuthField
            autoComplete="off"
            helperText="Usa los 9 dígitos de tu número celular, sin espacios."
            icon="call"
            id="phone"
            inputMode="numeric"
            label="Teléfono"
            maxLength={9}
            minLength={9}
            name="phone"
            numericOnly
            onChange={change}
            pattern="9[0-9]{8}"
            required
            type="tel"
            value={values.phone}
          />
          <PasswordField
            autoComplete="off"
            id="password"
            name="password"
            onChange={change}
            required
            showFeedback
            value={values.password}
            variant="auth"
          />
          <PasswordField
            autoComplete="off"
            compareTo={values.password}
            id="passwordConfirmation"
            label="Confirmar contraseña"
            name="passwordConfirmation"
            onChange={change}
            required
            value={values.passwordConfirmation}
            variant="auth"
          />
          <AuthButton>Continuar</AuthButton>
        </form>
      ) : null}
      {!loading && step === 2 ? (
        <form className="grid gap-3" onSubmit={next}>
          <AuthField
            icon="store"
            id="businessName"
            label="Nombre comercial"
            name="businessName"
            onChange={change}
            required
            value={values.businessName}
          />
          <AuthField
            id="legalName"
            label="Razón social (opcional)"
            name="legalName"
            onChange={change}
            value={values.legalName}
          />
          <div className="grid grid-cols-2 gap-3">
            <AuthField
              id="taxDocument"
              label="RUC o documento"
              name="taxDocument"
              onChange={change}
              value={values.taxDocument}
            />
            <label className="text-sm font-bold">
              Tipo de negocio
              <select
                className={`${field} mt-2`}
                name="businessTypeId"
                onChange={change}
                required
                value={values.businessTypeId}
              >
                {types.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-bold">
              Empleados aprox.
              <input
                className={`${field} mt-2`}
                min="1"
                name="employeeCount"
                onChange={change}
                required
                type="number"
                value={values.employeeCount}
              />
            </label>
            <label className="text-sm font-bold">
              Locales
              <input
                className={`${field} mt-2`}
                min="1"
                name="locationCount"
                onChange={change}
                required
                type="number"
                value={values.locationCount}
              />
            </label>
          </div>
          <AuthField
            icon="location_on"
            id="site"
            label="Nombre del local principal"
            name="site"
            onChange={change}
            required
            value={values.site}
          />
          <AuthField
            id="address"
            label="Dirección"
            name="address"
            onChange={change}
            value={values.address}
          />
          <AuthButton>Continuar</AuthButton>
        </form>
      ) : null}
      {!loading && step === 3 ? (
        <div>
          <div className="grid grid-cols-2 rounded-xl bg-surface-container p-1">
            <button
              className={`min-h-10 rounded-lg font-bold ${values.billingInterval === "monthly" ? "bg-white text-primary shadow-sm" : ""}`}
              name="billingInterval"
              onClick={() =>
                setValues((v) => ({ ...v, billingInterval: "monthly" }))
              }
              type="button"
            >
              Mensual
            </button>
            <button
              className={`min-h-10 rounded-lg font-bold ${values.billingInterval === "annual" ? "bg-white text-primary shadow-sm" : ""}`}
              onClick={() =>
                setValues((v) => ({ ...v, billingInterval: "annual" }))
              }
              type="button"
            >
              Anual
            </button>
          </div>
          <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-3">
            {plans.map((plan) => {
              const price = priceOf(plan, values.billingInterval);
              return (
                <button
                  className={`min-w-[240px] snap-start rounded-2xl border p-4 text-left ${values.planCode === plan.code ? "border-primary bg-primary-fixed/40 ring-2 ring-primary/10" : "border-outline-variant bg-white"}`}
                  key={plan.id}
                  onClick={() =>
                    setValues((v) => ({ ...v, planCode: plan.code }))
                  }
                  type="button"
                >
                  <p className="text-xs font-bold text-primary">{plan.code}</p>
                  <h2 className="mt-1 text-xl font-bold">{plan.name}</h2>
                  <p className="mt-2 text-2xl font-bold">
                    {money(price?.amount, price?.currency)}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {values.billingInterval === "annual"
                      ? "por año"
                      : "por mes"}{" "}
                    · {plan.trialDays} días de prueba
                  </p>
                  <ul className="mt-3 text-xs leading-6 text-on-surface-variant">
                    <li>{plan.maxUsers} usuarios</li>
                    <li>{plan.maxBranches} locales</li>
                    <li>{plan.maxMonthlyOperations} operaciones/mes</li>
                  </ul>
                </button>
              );
            })}
          </div>
          <AuthButton onClick={next} type="button">
            Elegir {selected?.name}
          </AuthButton>
        </div>
      ) : null}
      {!loading && step === 4 ? (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-primary bg-primary-fixed/40 p-5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-primary">
                verified
              </span>
              <div>
                <h2 className="font-bold">Prueba gratuita sin tarjeta</h2>
                <p className="text-sm text-on-surface-variant">
                  Tendrás {selected?.trialDays} días. Próximo cobro estimado al
                  finalizar la prueba.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-primary/20 pt-4">
              <span>
                {selected?.name} ·{" "}
                {values.billingInterval === "annual" ? "anual" : "mensual"}
              </span>
              <b>{money(priceOf(selected, values.billingInterval)?.amount)}</b>
            </div>
          </div>
          <p className="rounded-xl bg-surface-container p-3 text-xs leading-5 text-on-surface-variant">
            Wasita no activará cobros desde el navegador. Cuando conectes un
            medio de pago, el backend esperará la confirmación firmada de la
            pasarela.
          </p>
          <AuthButton onClick={next} type="button">
            Continuar con la prueba
          </AuthButton>
        </div>
      ) : null}
      {!loading && step === 5 ? (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-outline-variant bg-white p-4 text-sm">
            <h2 className="font-bold">Resumen</h2>
            <dl className="mt-3 grid gap-2">
              <div className="flex justify-between">
                <dt>Administrador</dt>
                <dd className="font-bold">{values.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Empresa</dt>
                <dd className="font-bold">{values.businessName}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Plan</dt>
                <dd className="font-bold">{selected?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Locales</dt>
                <dd className="font-bold">{values.locationCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Hoy</dt>
                <dd className="font-bold text-emerald-700">Sin cobro</dd>
              </div>
            </dl>
          </div>
          <label className="flex gap-3 rounded-xl bg-surface-container p-3 text-sm">
            <input
              checked={values.accept}
              name="accept"
              onChange={change}
              type="checkbox"
            />
            <span>
              Acepto los{" "}
              <Link className="font-bold text-primary" to="/terms">
                términos
              </Link>{" "}
              y la{" "}
              <Link className="font-bold text-primary" to="/privacy">
                política de privacidad
              </Link>
              .
            </span>
          </label>
          <AuthButton disabled={submitting} onClick={submit} type="button">
            {submitting
              ? "Creando empresa..."
              : "Crear empresa e iniciar prueba"}
          </AuthButton>
        </div>
      ) : null}
      {step > 1 ? (
        <button
          className="mt-3 min-h-10 w-full text-sm font-bold text-primary"
          disabled={submitting}
          onClick={() => {
            setError("");
            setStep((x) => x - 1);
          }}
          type="button"
        >
          ← Volver al paso anterior
        </button>
      ) : null}
      <p className="mt-4 text-center text-sm text-on-surface-variant">
        ¿Ya tienes cuenta?{" "}
        <Link className="font-bold text-primary" to="/login">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
