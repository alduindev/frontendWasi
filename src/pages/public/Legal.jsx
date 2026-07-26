import PublicLayout from "../../components/public/PublicLayout";
const legal = {
  terms: {
    title: "Términos y condiciones",
    intro: "Reglas generales para utilizar Wasita.",
    sections: [
      [
        "Cuenta y acceso",
        "Cada usuario debe proteger sus credenciales y utilizar una cuenta individual.",
      ],
      [
        "Uso del servicio",
        "Wasita debe utilizarse de forma lícita y respetando los permisos asignados por la empresa.",
      ],
      [
        "Planes y disponibilidad",
        "Los límites dependen del plan. Las funciones futuras o de pago se identifican claramente.",
      ],
      [
        "Datos",
        "Cada empresa es responsable de la exactitud de la información que registra.",
      ],
    ],
  },
  privacy: {
    title: "Política de privacidad",
    intro: "Cómo tratamos la información dentro de la plataforma.",
    sections: [
      [
        "Datos recopilados",
        "Datos de cuenta, empresa, inventario, ventas y actividad necesarios para prestar el servicio.",
      ],
      [
        "Finalidad",
        "Autenticación, operación del negocio, seguridad, soporte y mejora del producto.",
      ],
      [
        "Seguridad",
        "Contraseñas hasheadas, sesiones con expiración, permisos y separación por empresa.",
      ],
      [
        "Derechos",
        "Puedes solicitar acceso, rectificación o eliminación mediante la página de Contacto.",
      ],
    ],
  },
  status: {
    title: "Estado del sistema",
    intro: "Información operativa del entorno actual.",
    sections: [
      [
        "Frontend",
        "Disponible cuando el servicio Vite o el despliegue web está activo.",
      ],
      ["API", "Consulta /health para verificar FastAPI."],
      [
        "Base de datos",
        "SQLite en desarrollo; PostgreSQL está recomendado para producción.",
      ],
      [
        "Incidentes",
        "El monitoreo público automatizado será incorporado antes del lanzamiento comercial.",
      ],
    ],
  },
  api: {
    title: "Documentación API",
    intro: "Wasita utiliza una API REST construida con FastAPI.",
    sections: [
      ["Swagger", "En desarrollo: http://127.0.0.1:8000/docs"],
      [
        "Autenticación",
        "Cookie HTTP-only para web. La arquitectura móvil requerirá tokens revocables.",
      ],
      [
        "Aislamiento",
        "Los endpoints empresariales validan business_id y permisos.",
      ],
      ["Versionado", "La API actual utiliza el prefijo /api/v1."],
    ],
  },
};
export default function Legal({ type }) {
  const page = legal[type];
  return (
    <PublicLayout>
      <main className="mx-auto max-w-4xl px-4 py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">
          Información legal y técnica
        </p>
        <h1 className="mt-3 font-heading text-4xl font-extrabold">
          {page.title}
        </h1>
        <p className="mt-5 text-lg text-on-surface-variant">{page.intro}</p>
        <div className="mt-10 grid gap-4">
          {page.sections.map(([title, text]) => (
            <section
              className="rounded-2xl border border-outline-variant bg-white p-6"
              key={title}
            >
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="mt-2 leading-7 text-on-surface-variant">{text}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 text-sm text-on-surface-variant">
          Última actualización: 10 de julio de 2026.
        </p>
      </main>
    </PublicLayout>
  );
}
