// Contenido separado del JSX para facilitar internacionalización futura (i18n JSON)
export const aboutIntro = {
  eyebrow: "Sobre Wasita",
  title: "El sistema que se adapta a tu negocio, no al revés",
  lead:
    "Wasita nace para dar a pequeños y medianos negocios herramientas claras, seguras y preparadas para crecer. No es un sistema genérico de inventario: es una plataforma que se configura según el tipo de negocio que tengas, mostrando solo lo que necesitas usar.",
  paragraphs: [
    "Fue pensada para tiendas, bodegas, hostales, restaurantes, farmacias, clínicas, veterinarias, consultorios y negocios similares que hoy operan con cuadernos, hojas de cálculo o sistemas que no encajan con su forma de trabajar.",
    "En vez de forzar a todos los negocios a usar los mismos módulos, Wasita habilita los formularios, procesos y reportes que corresponden a tu rubro — así un hostal gestiona habitaciones y una clínica gestiona pacientes, dentro de la misma plataforma.",
  ],
};

export const businessTypes = [
  { id: "tienda", label: "Tiendas", detail: "Productos, ventas, proveedores e inventario" },
  { id: "bodega", label: "Bodegas", detail: "Control de stock y ventas diarias simplificado" },
  { id: "hostal", label: "Hostales", detail: "Habitaciones, reservas, huéspedes y limpieza" },
  { id: "restaurante", label: "Restaurantes", detail: "Mesas, pedidos, cocina e insumos" },
  { id: "farmacia", label: "Farmacias", detail: "Inventario de productos y control de vencimientos" },
  { id: "clinica", label: "Clínicas", detail: "Pacientes, citas, historias clínicas y profesionales" },
  { id: "veterinaria", label: "Veterinarias", detail: "Mascotas, propietarios, consultas y vacunas" },
  { id: "consultorio", label: "Consultorios", detail: "Agenda, atención y seguimiento de pacientes" },
];

export const aboutFeatures = [
  {
    id: "accesible",
    name: "Diseño accesible",
    summary: "Interfaz clara y usable para todo tipo de negocio",
    items: [
      "Navegación sencilla, sin curva de aprendizaje larga",
      "Diseño adaptable a computadoras, tablets y celulares",
      "Formularios específicos según el tipo de negocio",
      "Textos claros y buen contraste visual",
      "Tutoriales guiados para nuevos usuarios",
      "Compatible con mouse, teclado y pantallas táctiles",
    ],
  },
  {
    id: "protegidos",
    name: "Datos protegidos",
    summary: "Seguridad y control sobre la información de cada empresa",
    items: [
      "Inicio de sesión seguro y sesiones controladas",
      "Control de acceso según roles y permisos personalizados",
      "Separación total de información entre empresas",
      "Registro de actividades importantes del sistema",
      "Restricción de información sensible para operadores",
      "Un operario no ve datos administrativos o financieros que no le corresponden",
    ],
  },
  {
    id: "crecimiento",
    name: "Soporte en crecimiento",
    summary: "Acompañamiento a medida que el negocio se expande",
    items: [
      "Agrega nuevos usuarios y roles personalizados cuando lo necesites",
      "Suma nuevas sucursales sin cambiar de sistema",
      "Habilita nuevos módulos según evoluciona tu operación",
      "Planes escalables y reportes cada vez más avanzados",
      "Orientación y soporte durante cada etapa de crecimiento",
    ],
  },
];

export const missionPoints = [
  {
    title: "Simplificar la gestión",
    text: "Reducir procesos manuales, documentos desordenados, hojas de cálculo separadas y tareas repetitivas que consumen tiempo.",
  },
  {
    title: "Herramientas profesionales a precio justo",
    text: "Los pequeños negocios también merecen acceso a herramientas modernas y seguras, sin pagar precios de sistemas empresariales complejos.",
  },
  {
    title: "Acompañar el crecimiento",
    text: "Wasita evoluciona junto al negocio: nuevas funciones, colaboradores y sucursales sin necesidad de migrar de sistema.",
  },
];

export const howWeWork = [
  { step: "1", title: "Conocemos el negocio", text: "Eliges el tipo de empresa y compartes información básica sobre tu operación." },
  { step: "2", title: "Configuramos tu espacio", text: "Habilitamos los módulos, formularios y roles que corresponden a tu tipo de negocio." },
  { step: "3", title: "Organizamos la operación", text: "Configuras usuarios, permisos, productos, habitaciones, pacientes u otros elementos clave." },
  { step: "4", title: "Acompañamos el uso", text: "Tutoriales, ayudas contextuales y soporte para facilitar la adopción desde el primer día." },
  { step: "5", title: "Crecemos juntos", text: "Incorporas más usuarios, módulos y sucursales cuando tu negocio lo necesite." },
];

export const values = [
  { name: "Simplicidad", text: "Menos pasos, más claridad en cada acción." },
  { name: "Seguridad", text: "Tus datos y los de tus clientes, siempre resguardados." },
  { name: "Accesibilidad", text: "Pensado para usarse sin ser experto en tecnología." },
  { name: "Transparencia", text: "Precios y funciones claras, sin letra pequeña." },
  { name: "Cercanía", text: "Soporte real, no respuestas automáticas." },
  { name: "Adaptabilidad", text: "Se ajusta a tu rubro, no al revés." },
  { name: "Crecimiento", text: "Escala contigo desde el día uno." },
  { name: "Precio justo", text: "Herramientas profesionales sin costos empresariales." },
];

export const aboutCtas = [
  { label: "Conoce nuestros planes", to: "/pricing", variant: "primary" },
  { label: "Empieza con Wasita", to: "/register", variant: "outline" },
  { label: "Solicita más información", to: "/contacto", variant: "outline" },
];