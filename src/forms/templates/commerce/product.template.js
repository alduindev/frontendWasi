import { registerFormTemplate } from "../../engine/templateRegistry";
export default registerFormTemplate({
  key: "commerce.product",
  title: { create: "Agregar producto", edit: "Editar producto" },
  defaults: {
    cost: 0,
    price: 0,
    tax: 18,
    stock: 0,
    minStock: 0,
    status: "active",
    unit: "unit",
    usageType: "retail",
  },
  sections: [
    {
      id: "identity",
      title: "Identificación",
      icon: "qr_code_2",
      fields: [
        {
          name: "name",
          label: "Nombre",
          required: true,
          placeholder: "Ej. Café orgánico",
        },
        { name: "sku", label: "SKU", required: true },
        { name: "barcode", label: "Código de barras" },
        {
          name: "category",
          label: "Categoría",
          type: "catalog",
          catalog: "product-categories",
        },
        { name: "brand", label: "Marca", type: "catalog", catalog: "brands" },
        {
          name: "supplier",
          label: "Proveedor",
          type: "catalog",
          catalog: "suppliers",
        },
      ],
    },
    {
      id: "commercial",
      title: "Precio e inventario",
      icon: "inventory_2",
      fields: [
        { name: "cost", label: "Costo", type: "number", min: 0, step: "0.01" },
        {
          name: "price",
          label: "Precio",
          type: "number",
          min: 0,
          step: "0.01",
        },
        {
          name: "tax",
          label: "Impuesto",
          type: "catalog",
          catalog: "tax-rates",
        },
        { name: "stock", label: "Stock actual", type: "number", min: 0 },
        { name: "minStock", label: "Stock mínimo", type: "number", min: 0 },
        { name: "unit", label: "Unidad", type: "catalog", catalog: "units" },
        {
          name: "status",
          label: "Estado",
          type: "catalog",
          catalog: "product-statuses",
        },
        {
          name: "usageType",
          label: "Uso del producto",
          type: "select",
          options: [
            { value: "clinical", label: "Insumo clínico" },
            { value: "retail", label: "Producto vendible" },
            { value: "medication", label: "Medicamento cobrable" },
            { value: "equipment", label: "Equipo no consumible" },
          ],
        },
      ],
    },
    {
      id: "detail",
      title: "Información adicional",
      icon: "notes",
      fields: [
        { name: "description", label: "Descripción", type: "textarea" },
        { name: "notes", label: "Observaciones", type: "textarea" },
      ],
    },
  ],
});
