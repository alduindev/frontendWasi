import { registerFormTemplate } from "../../engine/templateRegistry";
export default registerFormTemplate({
  key: "hospitality.guest",
  title: { create: "Registrar huésped", edit: "Editar huésped" },
  defaults: { documentType: "dni", nationality: "PE", notes: "" },
  sections: [
    {
      id: "identity",
      title: "Identidad",
      icon: "badge",
      fields: [
        { name: "name", label: "Nombre completo", required: true },
        {
          name: "documentType",
          label: "Tipo de documento",
          type: "catalog",
          catalog: "document-types",
          required: true,
        },
        { name: "document", label: "Número de documento", required: true },
        {
          name: "nationality",
          label: "Nacionalidad",
          type: "catalog",
          catalog: "countries",
          required: true,
        },
      ],
    },
    {
      id: "contact",
      title: "Contacto",
      icon: "contact_phone",
      fields: [
        { name: "phone", label: "Teléfono", type: "tel" },
        { name: "email", label: "Correo", type: "email" },
        {
          name: "notes",
          label: "Preferencias u observaciones",
          type: "textarea",
        },
      ],
    },
  ],
});
