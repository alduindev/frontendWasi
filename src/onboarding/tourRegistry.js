const page = '[data-onboarding="page-content"]';
const action = '[data-onboarding="page-action"]';

const intro = (title, description, icon = "explore") => ({
  title,
  description,
  icon,
  selector: page,
});
const tutorials = [
  {
    id: "admin-dashboard",
    role: "admin",
    path: "/dashboard",
    title: "Dashboard",
    keywords: "resumen indicadores graficos",
    steps: [
      intro(
        "Tu resumen ejecutivo",
        "Úsalo al iniciar la jornada para detectar cambios importantes antes de entrar al detalle.",
        "dashboard",
      ),
      {
        title: "Indicadores accionables",
        description:
          "Cada indicador abre el conjunto de productos que explica el dato. Esto ayuda a pasar del resumen a una decisión concreta.",
        icon: "monitoring",
        selector: '[data-tour="metrics"]',
      },
      {
        title: "Visualizaciones",
        description:
          "Alterna entre gráficos, alertas y productos destacados para analizar el inventario desde distintas perspectivas.",
        icon: "bar_chart",
        selector: '[data-tour="visual-tabs"]',
      },
    ],
  },
  {
    id: "admin-inventory",
    role: "admin",
    path: "/dashboard/inventory",
    title: "Inventario",
    keywords: "productos buscar filtros crear importar exportar masivas",
    steps: [
      intro(
        "Centro del inventario",
        "Aquí administras el catálogo real. Mantén SKU, precio y stock actualizados para que ventas y alertas sean confiables.",
        "inventory_2",
      ),
      {
        title: "Búsqueda y filtros",
        description:
          "Combina stock, categoría, estado y rangos cuando el catálogo crezca. Filtrar antes de exportar produce reportes más útiles.",
        icon: "filter_alt",
        selector: '[data-tour="inventory-toolbar"]',
      },
      {
        title: "Crear producto",
        description:
          "Registra un producto solo cuando tengas SKU, costo, precio y stock inicial verificados; así evitas correcciones posteriores.",
        icon: "add_box",
        selector: action,
      },
      {
        title: "Listado y acciones",
        description:
          "Selecciona filas para acciones masivas o usa las acciones individuales para ver, editar y eliminar con mayor precisión.",
        icon: "table_rows",
        selector: '[data-tour="product-list"]',
      },
    ],
  },
  {
    id: "admin-alerts",
    role: "admin",
    path: "/dashboard/alerts",
    title: "Alertas",
    keywords: "stock bajo agotados prioridad",
    steps: [
      intro(
        "Alertas de inventario",
        "Prioriza productos agotados y luego los de stock bajo. Resolverlos temprano evita ventas perdidas.",
        "notifications",
      ),
      {
        title: "Clasificación y detalle",
        description:
          "Las tarjetas explican la severidad y te llevan al producto afectado para corregir su stock o configuración.",
        icon: "warning",
        selector: `${page} a, ${page} article`,
      },
    ],
  },
  {
    id: "admin-history",
    role: "admin",
    path: "/dashboard/history",
    title: "Historial",
    keywords: "auditoria cambios movimientos",
    steps: [
      intro(
        "Auditoría de actividad",
        "Consulta quién realizó cada cambio y cuándo ocurrió. Úsalo para investigar diferencias de inventario.",
        "history",
      ),
      {
        title: "Filtros de auditoría",
        description:
          "Acota por acción, usuario o fecha antes de revisar eventos; evita borrar el historial salvo que exista una política definida.",
        icon: "manage_search",
        selector: `${page} form, ${page} select`,
      },
    ],
  },
  {
    id: "admin-invoices",
    role: "admin",
    path: "/dashboard/invoices",
    title: "Comprobantes",
    keywords: "ventas boleta factura anular",
    steps: [
      intro(
        "Ventas y comprobantes",
        "Aquí se concentran boletas y facturas emitidas contra el inventario real.",
        "receipt_long",
      ),
      {
        title: "Registrar venta",
        description:
          "Selecciona productos y cantidades, valida los datos del cliente y el método de pago antes de emitir.",
        icon: "add_shopping_cart",
        selector: action,
      },
      {
        title: "Control de comprobantes",
        description:
          "Abre el detalle para verificar líneas e importes. Anula únicamente cuando corresponda, porque la acción afecta el stock y la trazabilidad.",
        icon: "fact_check",
        selector: `${page} article, ${page} [class*="grid"]`,
      },
    ],
  },
  {
    id: "admin-team",
    role: "admin",
    path: "/dashboard/team",
    title: "Equipo",
    keywords: "usuarios operadores permisos acceso",
    steps: [
      intro(
        "Usuarios y permisos",
        "Crea cuentas individuales para saber quién realiza cada operación. No compartas credenciales entre operadores.",
        "group",
      ),
      {
        title: "Agregar operador",
        description:
          "Asigna datos verificables y una contraseña temporal segura. El operador verá solo su espacio de trabajo.",
        icon: "person_add",
        selector: action,
      },
      {
        title: "Administrar accesos",
        description:
          "Edita datos cuando cambie una asignación y elimina accesos que ya no deban entrar al negocio.",
        icon: "admin_panel_settings",
        selector: `${page} article, ${page} [class*="grid"]`,
      },
    ],
  },
  {
    id: "admin-operator-performance",
    role: "admin",
    match: (path) => path.startsWith("/dashboard/team/"),
    title: "Rendimiento del operario",
    keywords: "operario ventas metricas timeline productividad",
    steps: [
      intro(
        "Dashboard individual",
        "Analiza resultados y actividad de un único operario sin exponer información de otros usuarios.",
        "monitoring",
      ),
      {
        title: "Métricas de rendimiento",
        description:
          "Compara períodos, ticket promedio y productos vendidos. Usa estos datos como apoyo, no como única medida del desempeño.",
        icon: "analytics",
        selector: `${page} [class*="grid"]`,
      },
      {
        title: "Actividad y ventas",
        description:
          "La línea de tiempo procede de eventos auditados; las ventas se pueden buscar por cliente, comprobante o tipo.",
        icon: "timeline",
        selector: `${page} article`,
      },
    ],
  },
  {
    id: "admin-profile",
    role: "admin",
    path: "/dashboard/profile",
    title: "Perfil",
    keywords: "cuenta datos contraseña",
    steps: [
      intro(
        "Tu perfil",
        "Mantén correctos tus datos de contacto; se utilizan para identificar tu actividad dentro de Wasita.",
        "person",
      ),
      {
        title: "Datos de cuenta",
        description:
          "Revisa los campos antes de guardar. Usa el control de visibilidad para comprobar contraseñas sin exponerlas innecesariamente.",
        icon: "edit",
        selector: `${page} form`,
      },
    ],
  },
  {
    id: "admin-settings",
    role: "admin",
    path: "/dashboard/settings",
    title: "Configuración",
    keywords: "idioma moneda fecha tutorial preferencias",
    steps: [
      intro(
        "Configuración del negocio",
        "Ajusta formatos regionales y comportamiento general sin modificar los datos operativos.",
        "settings",
      ),
      {
        title: "Preferencias",
        description:
          "Elige moneda, idioma y formato de fecha coherentes con la operación de tu negocio.",
        icon: "tune",
        selector: `${page} form`,
      },
      {
        title: "Aprender de nuevo",
        description:
          "Puedes repetir cualquier recorrido desde el Centro de ayuda o reiniciar el aprendizaje completo desde esta pantalla.",
        icon: "school",
        selector: '[data-tour="restart-tutorial"]',
      },
    ],
  },
  {
    id: "admin-product",
    role: "admin",
    match: (path) => path.startsWith("/dashboard/product/"),
    title: "Detalle de producto",
    keywords: "producto stock editar eliminar historial",
    steps: [
      intro(
        "Ficha del producto",
        "Reúne precios, stock, identidad e historial para revisar un artículo sin perder contexto.",
        "inventory",
      ),
      {
        title: "Acciones sensibles",
        description:
          "Edita cuando la información cambie y elimina solo duplicados o productos creados por error; la eliminación requiere confirmación.",
        icon: "edit_note",
        selector: `${page} button`,
      },
    ],
  },
  {
    id: "operator-home",
    role: "operator",
    path: "/pos",
    title: "Inicio",
    keywords: "resumen accesos jornada",
    steps: [
      intro(
        "Tu espacio de trabajo",
        "Muestra únicamente la información necesaria para atender clientes y controlar tu jornada.",
        "home",
      ),
      {
        title: "Accesos rápidos",
        description:
          "Empieza una venta o consulta stock desde estas tarjetas sin recorrer menús administrativos.",
        icon: "bolt",
        selector: `${page} a`,
      },
    ],
  },
  {
    id: "operator-products",
    role: "operator",
    path: "/pos/products",
    title: "Productos",
    keywords: "buscar precio stock codigo",
    steps: [
      intro(
        "Consulta de productos",
        "Comprueba precio y disponibilidad antes de prometer un producto al cliente.",
        "inventory_2",
      ),
      {
        title: "Búsqueda rápida",
        description:
          "Busca por nombre, SKU, código o categoría. Si no aparece, revisa la escritura antes de informar que no hay stock.",
        icon: "search",
        selector: `${page} input`,
      },
      {
        title: "Disponibilidad",
        description:
          "Cada tarjeta muestra precio y stock actual provenientes del inventario compartido.",
        icon: "sell",
        selector: `${page} article, ${page} [class*="grid"]`,
      },
    ],
  },
  {
    id: "operator-sale",
    role: "operator",
    path: "/pos/sale",
    title: "Nueva venta",
    keywords: "venta buscar carrito cobrar comprobante pago",
    steps: [
      intro(
        "Registrar una venta",
        "Busca productos, confirma cantidades y cobra sin abandonar esta pantalla.",
        "point_of_sale",
      ),
      {
        title: "Buscar y agregar",
        description:
          "Escanea un código o escribe nombre o SKU. Enter agrega el primer resultado; verifica siempre el producto antes de continuar.",
        icon: "barcode_scanner",
        selector: `${page} section input`,
      },
      {
        title: "Carrito",
        description:
          "Ajusta cantidades y revisa el stock restante. El total se actualiza automáticamente.",
        icon: "shopping_cart",
        selector: `${page} aside`,
      },
      {
        title: "Cobro y comprobante",
        description:
          "Continúa al cobro, elige boleta o factura y valida cliente, pago y monto recibido antes de confirmar.",
        icon: "payments",
        selector: `${page} aside button`,
      },
    ],
  },
  {
    id: "operator-invoices",
    role: "operator",
    path: "/pos/invoices",
    title: "Mis comprobantes",
    keywords: "boletas facturas imprimir duplicar",
    steps: [
      intro(
        "Tus comprobantes",
        "Aquí aparecen únicamente los documentos emitidos por tu cuenta.",
        "receipt_long",
      ),
      {
        title: "Detalle y repetición",
        description:
          "Abre un comprobante para imprimirlo o duplica una venta recurrente y revisa sus cantidades antes de cobrar.",
        icon: "content_copy",
        selector: `${page} article`,
      },
    ],
  },
  {
    id: "operator-history",
    role: "operator",
    path: "/pos/history",
    title: "Mi historial",
    keywords: "ventas jornada movimientos",
    steps: [
      intro(
        "Historial de ventas",
        "Consulta fecha, productos, total y estado de cada operación realizada por tu usuario.",
        "history",
      ),
      {
        title: "Verificación de jornada",
        description:
          "Úsalo para comprobar una venta reciente o conciliar tus operaciones al terminar el turno.",
        icon: "checklist",
        selector: `${page} article`,
      },
    ],
  },
  {
    id: "operator-profile",
    role: "operator",
    path: "/pos/profile",
    title: "Mi perfil",
    keywords: "cuenta datos sede",
    steps: [
      intro(
        "Datos de tu cuenta",
        "Actualiza tus datos personales; la sede asignada permanece protegida y debe cambiarla un administrador.",
        "person",
      ),
      {
        title: "Guardar cambios",
        description:
          "Comprueba correo y teléfono antes de guardar para mantener una cuenta recuperable e identificable.",
        icon: "save",
        selector: `${page} form`,
      },
    ],
  },
];

export function getTutorials(role) {
  return tutorials.filter((tour) => tour.role === role);
}
export function resolveTutorial(role, pathname) {
  return (
    getTutorials(role).find(
      (tour) => tour.path === pathname || tour.match?.(pathname),
    ) || null
  );
}
