import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthButton from "../../components/molecules/AuthButton";
import AuthField from "../../components/molecules/AuthField";
import PasswordField from "../../components/molecules/PasswordField";
import AuthLayout from "../../components/organisms/AuthLayout";
import { useAuth } from "../../context/authStore";
import { getBusinessTypes } from "../../services/businessTypeService";
import { getMedicalServiceTypes } from "../../services/medicalServiceTypeService";
import { getPlans } from "../../services/platformService";

const field =
  "h-[52px] w-full rounded-2xl border border-outline-variant bg-white px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

const MEDICAL_CONSULTORY_SLUG = "consultorio-medico";

const WEEKDAYS = [
  ["monday", "Lun"],
  ["tuesday", "Mar"],
  ["wednesday", "Mié"],
  ["thursday", "Jue"],
  ["friday", "Vie"],
  ["saturday", "Sáb"],
];

const money = (value, currency = "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(
    Number(value || 0),
  );

const priceOf = (plan, interval) =>
  plan?.prices?.find(
    (item) => item.billingInterval === interval && item.currency === "PEN",
  );

function normalizeMedicalServiceTypes(response) {
  const items = Array.isArray(response)
    ? response
    : response?.items || response?.serviceTypes || response?.data || [];
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      id: String(item?.id || item?.code || ""),
      code: String(item?.code || item?.id || ""),
      name: String(item?.name || ""),
      description: String(item?.description || ""),
      icon: String(item?.icon || "medical_services"),
      roles: Array.isArray(item?.roles)
        ? item.roles
            .map((role) => ({
              id: String(role?.id || ""),
              code: String(role?.code || ""),
              name: String(role?.name || ""),
              description: String(role?.description || ""),
              permissions: Array.isArray(role?.permissions)
                ? role.permissions.map(String)
                : [],
            }))
            .filter((role) => role.id && role.code && role.name)
        : [],
    }))
    .filter((item) => item.id && item.name);
}

function registrationSteps(isMedicalConsultory) {
  return [
    { key: "account", title: "Cuenta", heading: "Crea tu acceso" },
    { key: "business", title: "Negocio", heading: "Cuéntanos sobre el negocio" },
    ...(isMedicalConsultory
      ? [
          {
            key: "medical-services",
            title: "Servicios médicos",
            heading: "Configura el consultorio",
          },
        ]
      : []),
    { key: "plan", title: "Plan", heading: "Elige la capacidad" },
    { key: "trial", title: "Pago o prueba", heading: "Confirma tu prueba" },
    { key: "review", title: "Configuración", heading: "Revisa y activa tu espacio" },
  ];
}

function isStrongPassword(value) {
  return (
    value.length >= 8 &&
    /[A-ZÁÉÍÓÚÑ]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]/.test(value)
  );
}

export default function Registro() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [types, setTypes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [medicalServiceTypes, setMedicalServiceTypes] = useState([]);
  const [medicalCatalogueError, setMedicalCatalogueError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submissionRef = useRef(false);
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
    medicalServices: [],
    ownerProfessionalProfile: {
      attendsPatients: false,
      professionalType: "",
      specialty: "",
      licenseNumber: "",
      medicalServiceIds: [],
      functionCodes: [],
      appointmentDurationMinutes: "30",
      availability: {
        weekdays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        startTime: "09:00",
        endTime: "18:00",
      },
    },
    accept: false,
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      getBusinessTypes(),
      getPlans(),
      getMedicalServiceTypes().catch(() => null),
    ])
      .then(([businessTypes, availablePlans, serviceTypes]) => {
        if (!active) return;
        const selectable = availablePlans.filter((item) => !item.isCustom);
        const normalizedServiceTypes = normalizeMedicalServiceTypes(serviceTypes);
        setTypes(businessTypes);
        setPlans(selectable);
        setMedicalServiceTypes(normalizedServiceTypes);
        setMedicalCatalogueError(
          normalizedServiceTypes.length
            ? ""
            : "No se pudo cargar el catálogo de servicios médicos. Reintenta en unos segundos.",
        );
        setValues((current) => ({
          ...current,
          businessTypeId: current.businessTypeId || businessTypes[0]?.id || "",
          planCode: selectable.some((item) => item.code === current.planCode)
            ? current.planCode
            : selectable[0]?.code || "",
        }));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedBusinessType = useMemo(
    () => types.find((type) => type.id === values.businessTypeId) || null,
    [types, values.businessTypeId],
  );
  const isMedicalConsultory =
    selectedBusinessType?.slug?.toLowerCase() === MEDICAL_CONSULTORY_SLUG;
  const steps = useMemo(
    () => registrationSteps(isMedicalConsultory),
    [isMedicalConsultory],
  );
  const currentStep = steps[step - 1] || steps[steps.length - 1];
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.code === values.planCode),
    [plans, values.planCode],
  );

  const change = (event) => {
    const { name, type, checked, value } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const updateProfessionalProfile = (name, value) => {
    setValues((current) => ({
      ...current,
      ownerProfessionalProfile: {
        ...current.ownerProfessionalProfile,
        [name]: value,
      },
    }));
  };

  const updateAvailability = (name, value) => {
    setValues((current) => ({
      ...current,
      ownerProfessionalProfile: {
        ...current.ownerProfessionalProfile,
        availability: {
          ...current.ownerProfessionalProfile.availability,
          [name]: value,
        },
      },
    }));
  };

  const toggleMedicalService = (serviceId) => {
    setValues((current) => {
      const selected = current.medicalServices.includes(serviceId);
      const medicalServices = selected
        ? current.medicalServices.filter((id) => id !== serviceId)
        : [...current.medicalServices, serviceId];
      const availableFunctionCodes = new Set(
        medicalServiceTypes
          .filter((service) => medicalServices.includes(service.id))
          .flatMap((service) => service.roles.map((role) => role.code)),
      );
      return {
        ...current,
        medicalServices,
        ownerProfessionalProfile: {
          ...current.ownerProfessionalProfile,
          medicalServiceIds: current.ownerProfessionalProfile.medicalServiceIds.filter(
            (id) => medicalServices.includes(id),
          ),
          functionCodes: current.ownerProfessionalProfile.functionCodes.filter(
            (code) => availableFunctionCodes.has(code),
          ),
        },
      };
    });
  };

  const toggleProfessionalService = (serviceId) => {
    setValues((current) => {
      const selected = current.ownerProfessionalProfile.medicalServiceIds.includes(
        serviceId,
      );
      const medicalServiceIds = selected
        ? current.ownerProfessionalProfile.medicalServiceIds.filter(
            (id) => id !== serviceId,
          )
        : [...current.ownerProfessionalProfile.medicalServiceIds, serviceId];
      const availableFunctionCodes = new Set(
        medicalServiceTypes
          .filter((service) => medicalServiceIds.includes(service.id))
          .flatMap((service) => service.roles.map((role) => role.code)),
      );
      return {
        ...current,
        ownerProfessionalProfile: {
          ...current.ownerProfessionalProfile,
          medicalServiceIds,
          functionCodes: current.ownerProfessionalProfile.functionCodes.filter(
            (code) => availableFunctionCodes.has(code),
          ),
        },
      };
    });
  };

  const toggleProfessionalRole = (code) => {
    setValues((current) => {
      const selected = current.ownerProfessionalProfile.functionCodes.includes(code);
      return {
        ...current,
        ownerProfessionalProfile: {
          ...current.ownerProfessionalProfile,
          functionCodes: selected
            ? current.ownerProfessionalProfile.functionCodes.filter(
                (item) => item !== code,
              )
            : [...current.ownerProfessionalProfile.functionCodes, code],
        },
      };
    });
  };

  const toggleWeekday = (weekday) => {
    setValues((current) => {
      const selected = current.ownerProfessionalProfile.availability.weekdays;
      return {
        ...current,
        ownerProfessionalProfile: {
          ...current.ownerProfessionalProfile,
          availability: {
            ...current.ownerProfessionalProfile.availability,
            weekdays: selected.includes(weekday)
              ? selected.filter((item) => item !== weekday)
              : [...selected, weekday],
          },
        },
      };
    });
  };

  const validateMedicalConfiguration = () => {
    if (medicalCatalogueError) return medicalCatalogueError;
    if (!values.medicalServices.length) {
      return "Selecciona al menos un servicio para habilitar el consultorio médico.";
    }
    const profile = values.ownerProfessionalProfile;
    if (!profile.attendsPatients) return "";
    if (profile.professionalType.trim().length < 2) {
      return "Indica el tipo de profesional que atenderá pacientes.";
    }
    if (profile.specialty.trim().length < 2) {
      return "Indica la especialidad principal del profesional responsable.";
    }
    if (!/^[A-Za-z0-9-]{4,30}$/.test(profile.licenseNumber.trim())) {
      return "Ingresa un número de colegiatura o licencia válido.";
    }
    if (!profile.availability.weekdays.length) {
      return "Selecciona por lo menos un día de atención.";
    }
    if (!profile.medicalServiceIds.length) {
      return "Selecciona los servicios que realizará este profesional.";
    }
    if (!profile.functionCodes.length) {
      return "Selecciona por lo menos una función profesional compatible.";
    }
    if (
      Number(profile.appointmentDurationMinutes) < 5 ||
      Number(profile.appointmentDurationMinutes) > 480
    ) {
      return "La duración promedio debe estar entre 5 y 480 minutos.";
    }
    if (profile.availability.startTime >= profile.availability.endTime) {
      return "La hora de inicio debe ser anterior a la hora de término.";
    }
    return "";
  };

  const next = (event) => {
    event?.preventDefault();
    setError("");
    if (currentStep.key === "account") {
      if (!isStrongPassword(values.password)) {
        setError(
          "La contraseña debe tener 8 caracteres, mayúscula, número y carácter especial.",
        );
        return;
      }
      if (values.password !== values.passwordConfirmation) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }
    if (currentStep.key === "medical-services") {
      const medicalError = validateMedicalConfiguration();
      if (medicalError) {
        setError(medicalError);
        return;
      }
    }
    if (
      currentStep.key === "plan" &&
      Number(values.locationCount) > Number(selectedPlan?.maxBranches || 1)
    ) {
      setError(
        `El plan seleccionado admite hasta ${selectedPlan?.maxBranches || 1} locales.`,
      );
      return;
    }
    setStep((current) => Math.min(steps.length, current + 1));
  };

  const submit = async () => {
    if (!values.accept) {
      setError("Debes aceptar los términos y la política de privacidad.");
      return;
    }
    if (submissionRef.current) return;
    submissionRef.current = true;
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
        // Only consultorio-medico receives this health-specific configuration.
        // Dental and all other registration payloads stay unchanged in meaning.
        medicalServices: isMedicalConsultory ? values.medicalServices : [],
        ownerProfessionalProfile: isMedicalConsultory
          ? {
              ...values.ownerProfessionalProfile,
              appointmentDurationMinutes: Number(
                values.ownerProfessionalProfile.appointmentDurationMinutes,
              ),
            }
          : null,
      });
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      submissionRef.current = false;
      setSubmitting(false);
    }
  };

  const selectedMedicalServiceNames = medicalServiceTypes
    .filter((service) => values.medicalServices.includes(service.id))
    .map((service) => service.name);
  const selectedProfessionalServices = medicalServiceTypes.filter((service) =>
    values.medicalServices.includes(service.id),
  );
  const availableProfessionalRoles = Array.from(
    new Map(
      selectedProfessionalServices
        .filter((service) =>
          values.ownerProfessionalProfile.medicalServiceIds.includes(service.id),
        )
        .flatMap((service) => service.roles)
        .filter((role) =>
          role.permissions.some((permission) =>
            ["health.records.create", "health.results.create"].includes(
              permission,
            ),
          ),
        )
        .map((role) => [role.code, role]),
    ).values(),
  );

  return (
    <AuthLayout
      description="Registro guiado, plan configurable y módulos adecuados para tu tipo de negocio."
      eyebrow="Cuenta nueva"
      title="Configura Wasita a tu medida"
    >
      <div className="mb-5">
        <div className="flex gap-1.5">
          {steps.map((item, index) => (
            <button
              aria-label={`Ir a ${item.title}`}
              className={`h-1.5 flex-1 rounded-full ${step >= index + 1 ? "bg-primary" : "bg-outline-variant"}`}
              disabled={submitting || index + 1 > step}
              key={item.key}
              onClick={() => setStep(index + 1)}
              type="button"
            />
          ))}
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-primary">
          Paso {step} de {steps.length} · {currentStep.title}
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold">
          {currentStep.heading}
        </h1>
      </div>

      {error ? (
        <p
          aria-live="assertive"
          className="mb-4 rounded-xl bg-error-container p-3 text-sm font-bold text-on-error-container"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-surface-container" />
      ) : null}

      {!loading && currentStep.key === "account" ? (
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

      {!loading && currentStep.key === "business" ? (
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
          <div className="grid gap-3 sm:grid-cols-2">
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
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {isMedicalConsultory ? (
            <div className="rounded-2xl border border-primary/25 bg-primary-fixed/35 p-3 text-sm text-on-surface-variant">
              <div className="flex gap-2">
                <span className="material-symbols-outlined text-primary">
                  medical_services
                </span>
                <p>
                  Configurarás los servicios clínicos y, si corresponde, el
                  perfil del propietario como profesional en el siguiente paso.
                  No se crea una cuenta duplicada.
                </p>
              </div>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold">
              Empleados aprox.
              <input
                className={`${field} mt-2`}
                inputMode="numeric"
                max="1000000"
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
                inputMode="numeric"
                max="1000"
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

      {!loading && currentStep.key === "medical-services" ? (
        <form className="grid gap-4" onSubmit={next}>
          <section aria-describedby="medical-services-description">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-heading text-lg font-bold">
                  Servicios del consultorio
                </h2>
                <p
                  className="mt-1 text-sm text-on-surface-variant"
                  id="medical-services-description"
                >
                  Selecciona los servicios que ofrecerá el consultorio. Esta
                  configuración definirá la agenda y los perfiles disponibles.
                </p>
              </div>
              <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary">
                {values.medicalServices.length} seleccionado
                {values.medicalServices.length === 1 ? "" : "s"}
              </span>
            </div>
            {medicalCatalogueError ? (
              <p className="mt-2 rounded-xl bg-error-container p-3 text-xs font-semibold text-on-error-container">
                {medicalCatalogueError}
              </p>
            ) : null}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {medicalServiceTypes.map((service) => {
                const selected = values.medicalServices.includes(service.id);
                return (
                  <button
                    aria-pressed={selected}
                    className={`min-h-24 rounded-2xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      selected
                        ? "border-primary bg-primary-fixed/45 ring-2 ring-primary/15"
                        : "border-outline-variant bg-white hover:border-primary/50"
                    }`}
                    key={service.id}
                    onClick={() => toggleMedicalService(service.id)}
                    type="button"
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className={`material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-primary text-white"
                            : "bg-surface-container text-primary"
                        }`}
                      >
                        {selected ? "check" : service.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold">{service.name}</span>
                        <span className="mt-1 block text-xs leading-5 text-on-surface-variant">
                          {service.description}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-outline-variant bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-lg font-bold">
                  Perfil profesional del propietario
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Si también atiendes pacientes, añadiremos tu perfil clínico a
                  esta misma cuenta de administrador.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold">
                <input
                  checked={values.ownerProfessionalProfile.attendsPatients}
                  className="h-5 w-5 accent-primary"
                  onChange={(event) =>
                    updateProfessionalProfile("attendsPatients", event.target.checked)
                  }
                  type="checkbox"
                />
                También atenderé pacientes
              </label>
            </div>

            {values.ownerProfessionalProfile.attendsPatients ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <AuthField
                  id="ownerProfessionalType"
                  label="Tipo de profesional"
                  minLength={2}
                  onChange={(event) =>
                    updateProfessionalProfile("professionalType", event.target.value)
                  }
                  placeholder="Ejemplo: Médico, fisioterapeuta o tecnólogo"
                  required
                  value={values.ownerProfessionalProfile.professionalType}
                />
                <AuthField
                  id="ownerProfessionalSpecialty"
                  label="Especialidad principal"
                  minLength={2}
                  onChange={(event) =>
                    updateProfessionalProfile("specialty", event.target.value)
                  }
                  required
                  value={values.ownerProfessionalProfile.specialty}
                />
                <AuthField
                  helperText="Ejemplo: CMP 12345 o una licencia institucional."
                  id="ownerProfessionalLicense"
                  label="Colegiatura o licencia"
                  maxLength={30}
                  minLength={4}
                  onChange={(event) =>
                    updateProfessionalProfile(
                      "licenseNumber",
                      event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
                    )
                  }
                  pattern="[A-Za-z0-9\-]{4,30}"
                  required
                  value={values.ownerProfessionalProfile.licenseNumber}
                />
                <label className="text-sm font-bold">
                  Duración promedio de cita (minutos)
                  <input
                    className={`${field} mt-2`}
                    max="480"
                    min="5"
                    onChange={(event) =>
                      updateProfessionalProfile(
                        "appointmentDurationMinutes",
                        event.target.value,
                      )
                    }
                    required
                    type="number"
                    value={
                      values.ownerProfessionalProfile.appointmentDurationMinutes
                    }
                  />
                </label>
                <div className="sm:col-span-2">
                  <p className="ml-1 text-sm font-semibold text-on-surface-variant">
                    Servicios que realizarás
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedProfessionalServices.map((service) => {
                      const selected =
                        values.ownerProfessionalProfile.medicalServiceIds.includes(
                          service.id,
                        );
                      return (
                        <button
                          aria-pressed={selected}
                          className={`min-h-10 rounded-xl border px-3 text-sm font-bold ${
                            selected
                              ? "border-primary bg-primary text-white"
                              : "border-outline-variant bg-white text-on-surface-variant"
                          }`}
                          key={service.id}
                          onClick={() => toggleProfessionalService(service.id)}
                          type="button"
                        >
                          {service.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="ml-1 text-sm font-semibold text-on-surface-variant">
                    Funciones compatibles
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availableProfessionalRoles.map((role) => {
                      const selected =
                        values.ownerProfessionalProfile.functionCodes.includes(
                          role.code,
                        );
                      return (
                        <button
                          aria-pressed={selected}
                          className={`min-h-10 rounded-xl border px-3 text-sm font-bold ${
                            selected
                              ? "border-primary bg-primary text-white"
                              : "border-outline-variant bg-white text-on-surface-variant"
                          }`}
                          key={role.id}
                          onClick={() => toggleProfessionalRole(role.code)}
                          title={role.description || role.name}
                          type="button"
                        >
                          {role.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="ml-1 text-sm font-semibold text-on-surface-variant">
                    Disponibilidad inicial
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {WEEKDAYS.map(([weekday, label]) => {
                      const selected =
                        values.ownerProfessionalProfile.availability.weekdays.includes(
                          weekday,
                        );
                      return (
                        <button
                          aria-pressed={selected}
                          className={`min-h-10 rounded-xl border px-3 text-sm font-bold ${
                            selected
                              ? "border-primary bg-primary text-white"
                              : "border-outline-variant bg-white text-on-surface-variant"
                          }`}
                          key={weekday}
                          onClick={() => toggleWeekday(weekday)}
                          type="button"
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="text-sm font-bold">
                  Inicio de atención
                  <input
                    className={`${field} mt-2`}
                    onChange={(event) =>
                      updateAvailability("startTime", event.target.value)
                    }
                    required
                    type="time"
                    value={values.ownerProfessionalProfile.availability.startTime}
                  />
                </label>
                <label className="text-sm font-bold">
                  Fin de atención
                  <input
                    className={`${field} mt-2`}
                    onChange={(event) =>
                      updateAvailability("endTime", event.target.value)
                    }
                    required
                    type="time"
                    value={values.ownerProfessionalProfile.availability.endTime}
                  />
                </label>
              </div>
            ) : null}
          </section>
          <AuthButton>Continuar</AuthButton>
        </form>
      ) : null}

      {!loading && currentStep.key === "plan" ? (
        <div>
          <div className="grid grid-cols-2 rounded-xl bg-surface-container p-1">
            <button
              className={`min-h-10 rounded-lg font-bold ${values.billingInterval === "monthly" ? "bg-white text-primary shadow-sm" : ""}`}
              onClick={() =>
                setValues((current) => ({
                  ...current,
                  billingInterval: "monthly",
                }))
              }
              type="button"
            >
              Mensual
            </button>
            <button
              className={`min-h-10 rounded-lg font-bold ${values.billingInterval === "annual" ? "bg-white text-primary shadow-sm" : ""}`}
              onClick={() =>
                setValues((current) => ({
                  ...current,
                  billingInterval: "annual",
                }))
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
                    setValues((current) => ({
                      ...current,
                      planCode: plan.code,
                    }))
                  }
                  type="button"
                >
                  <p className="text-xs font-bold text-primary">{plan.code}</p>
                  <h2 className="mt-1 text-xl font-bold">{plan.name}</h2>
                  <p className="mt-2 text-2xl font-bold">
                    {money(price?.amount, price?.currency)}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {values.billingInterval === "annual" ? "por año" : "por mes"}
                    {" · "}
                    {plan.trialDays} días de prueba
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
            Elegir {selectedPlan?.name}
          </AuthButton>
        </div>
      ) : null}

      {!loading && currentStep.key === "trial" ? (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-primary bg-primary-fixed/40 p-5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-primary">
                verified
              </span>
              <div>
                <h2 className="font-bold">Prueba gratuita sin tarjeta</h2>
                <p className="text-sm text-on-surface-variant">
                  Tendrás {selectedPlan?.trialDays} días. Próximo cobro estimado
                  al finalizar la prueba.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-primary/20 pt-4">
              <span>
                {selectedPlan?.name} · {" "}
                {values.billingInterval === "annual" ? "anual" : "mensual"}
              </span>
              <b>{money(priceOf(selectedPlan, values.billingInterval)?.amount)}</b>
            </div>
          </div>
          <p className="rounded-xl bg-surface-container p-3 text-xs leading-5 text-on-surface-variant">
            Wasita no activa cobros desde el navegador. Cuando conectes un medio
            de pago, el backend esperará la confirmación firmada de la pasarela.
          </p>
          <AuthButton onClick={next} type="button">
            Continuar con la prueba
          </AuthButton>
        </div>
      ) : null}

      {!loading && currentStep.key === "review" ? (
        <div aria-busy={submitting} className="grid gap-4">
          <div className="rounded-2xl border border-outline-variant bg-white p-4 text-sm">
            <h2 className="font-bold">Resumen</h2>
            <dl className="mt-3 grid gap-2">
              <div className="flex justify-between gap-4">
                <dt>Administrador</dt>
                <dd className="text-right font-bold">{values.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Empresa</dt>
                <dd className="text-right font-bold">{values.businessName}</dd>
              </div>
              {isMedicalConsultory ? (
                <div className="grid gap-1 border-t border-outline-variant pt-2">
                  <dt>Servicios médicos</dt>
                  <dd className="font-bold">
                    {selectedMedicalServiceNames.join(", ") || "Sin seleccionar"}
                  </dd>
                  {values.ownerProfessionalProfile.attendsPatients ? (
                    <dd className="text-on-surface-variant">
                      Propietario también atiende · {" "}
                      {values.ownerProfessionalProfile.professionalType} · {" "}
                      {values.ownerProfessionalProfile.specialty}
                    </dd>
                  ) : null}
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt>Plan</dt>
                <dd className="text-right font-bold">{selectedPlan?.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Locales</dt>
                <dd className="text-right font-bold">{values.locationCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Hoy</dt>
                <dd className="text-right font-bold text-emerald-700">Sin cobro</dd>
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
              Acepto los {" "}
              <Link className="font-bold text-primary" to="/terms">
                términos
              </Link>{" "}
              y la {" "}
              <Link className="font-bold text-primary" to="/privacy">
                política de privacidad
              </Link>
              .
            </span>
          </label>
          <AuthButton
            loading={submitting}
            loadingLabel="Creando y verificando tu espacio..."
            onClick={submit}
            type="button"
          >
            Crear empresa e iniciar prueba
          </AuthButton>
        </div>
      ) : null}

      {step > 1 ? (
        <button
          className="mt-3 min-h-10 w-full text-sm font-bold text-primary"
          disabled={submitting}
          onClick={() => {
            setError("");
            setStep((current) => Math.max(1, current - 1));
          }}
          type="button"
        >
          ← Volver al paso anterior
        </button>
      ) : null}
      <p className="mt-4 text-center text-sm text-on-surface-variant">
        ¿Ya tienes cuenta? {" "}
        <Link className="font-bold text-primary" to="/login">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
