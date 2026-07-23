import { registerFormTemplate } from "../../engine/templateRegistry";
export default registerFormTemplate({
  key: "pharmacy.medicine",
  title: { create: "Agregar medicamento", edit: "Editar medicamento" },
  defaults: { tax: 18, requiresPrescription: false, stock: 0, minStock: 0 },
  sections: [
    {
      id: "identity",
      title: "Medicamento",
      icon: "medication",
      fields: [
        { name: "commercialName", label: "Nombre comercial", required: true },
        { name: "genericName", label: "Nombre genérico", required: true },
        { name: "internalCode", label: "Código interno", required: true },
        { name: "barcode", label: "Código de barras" },
        {
          name: "laboratoryId",
          label: "Laboratorio",
          type: "catalog",
          catalog: "laboratories",
        },
        {
          name: "activeIngredientId",
          label: "Principio activo",
          type: "catalog",
          catalog: "active-ingredients",
        },
        { name: "concentration", label: "Concentración" },
        { name: "presentation", label: "Presentación" },
        { name: "dosageForm", label: "Forma farmacéutica" },
      ],
    },
    {
      id: "lot",
      title: "Lote y trazabilidad",
      icon: "science",
      fields: [
        { name: "lot", label: "Lote", required: true },
        { name: "manufacturedAt", label: "Fecha de fabricación", type: "date" },
        {
          name: "expiresAt",
          label: "Fecha de vencimiento",
          type: "date",
          required: true,
        },
        { name: "sanitaryRegistration", label: "Registro sanitario" },
        {
          name: "requiresPrescription",
          label: "Requiere receta médica",
          type: "checkbox",
        },
        { name: "storageTemperature", label: "Temperatura de almacenamiento" },
      ],
    },
    {
      id: "stock",
      title: "Inventario y venta",
      icon: "inventory",
      fields: [
        { name: "stock", label: "Stock actual", type: "number", min: 0 },
        { name: "minStock", label: "Stock mínimo", type: "number", min: 0 },
        {
          name: "purchasePrice",
          label: "Precio de compra",
          type: "number",
          min: 0,
          step: "0.01",
        },
        {
          name: "salePrice",
          label: "Precio de venta",
          type: "number",
          min: 0,
          step: "0.01",
        },
        {
          name: "supplierId",
          label: "Proveedor",
          type: "catalog",
          catalog: "suppliers",
        },
        {
          name: "categoryId",
          label: "Categoría",
          type: "catalog",
          catalog: "product-categories",
        },
        {
          name: "tax",
          label: "Impuesto",
          type: "catalog",
          catalog: "tax-rates",
        },
        { name: "notes", label: "Observaciones", type: "textarea" },
      ],
    },
  ],
});
