import { registerFormTemplate } from "../../engine/templateRegistry";
export default registerFormTemplate({
  key: "hospitality.room",
  title: { create: "Nueva habitación", edit: "Editar habitación" },
  defaults: {
    floor: 1,
    capacity: 2,
    nightlyRate: 0,
    status: "available",
    notes: "",
  },
  sections: [
    {
      id: "identity",
      title: "Identificación",
      icon: "bed",
      help: "Información visible para recepción y reservas.",
      fields: [
        {
          name: "number",
          label: "Número",
          required: true,
          placeholder: "Ej. 204",
        },
        {
          name: "name",
          label: "Nombre interno",
          placeholder: "Ej. Suite jardín",
        },
        {
          name: "roomType",
          label: "Tipo",
          type: "catalog",
          catalog: "room-types",
          required: true,
        },
        {
          name: "floor",
          label: "Piso",
          type: "number",
          min: 0,
          required: true,
        },
        {
          name: "capacity",
          label: "Capacidad",
          type: "number",
          min: 1,
          required: true,
        },
      ],
    },
    {
      id: "operation",
      title: "Operación y tarifa",
      icon: "payments",
      fields: [
        {
          name: "nightlyRate",
          label: "Precio por noche",
          type: "number",
          min: 0,
          step: "0.01",
          required: true,
        },
        {
          name: "status",
          label: "Estado",
          type: "catalog",
          catalog: "room-statuses",
          required: true,
        },
        {
          name: "notes",
          label: "Observaciones",
          type: "textarea",
          placeholder: "Indicaciones relevantes para recepción o limpieza.",
        },
      ],
    },
  ],
});
