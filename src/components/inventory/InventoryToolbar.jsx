import { useState } from 'react'
import { productCategories, productStatuses } from '../../data/dashboard'
import { limitDecimal, limitInteger } from '../../utils/inputLimits'
import Button from '../atoms/Button'
import Input from '../atoms/Input'
import Select from '../atoms/Select'

export default function InventoryToolbar({
  categories = productCategories,
  filters,
  onBulkCategory,
  onBulkStatus,
  onChange,
  onDuplicate,
  onExport,
  onImport,
  onRemoveSelected,
  permissions,
  selectedCount,
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const canBulk = permissions?.canBulkManageProducts
  const canExport = permissions?.canExportProducts
  const canImport = permissions?.canImportProducts

  return (
    <div className="mb-3 grid min-w-0 gap-2 rounded-2xl border border-outline-variant bg-white p-2.5 shadow-sm" data-tour="inventory-toolbar">
      <div className="grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <Select label="Stock" name="stockStatus" onChange={(event) => onChange('stockStatus', event.target.value)} value={filters.stockStatus}>
          <option value="all">Todos</option>
          <option value="low">Stock bajo</option>
          <option value="out">Agotados</option>
          <option value="ok">Suficiente</option>
        </Select>
        <Select label="Categoria" name="category" onChange={(event) => onChange('category', event.target.value)} value={filters.category}>
          <option value="all">Todas</option>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </Select>
        <Select label="Estado" name="status" onChange={(event) => onChange('status', event.target.value)} value={filters.status}>
          <option value="all">Todos</option>
          {productStatuses.map((status) => <option key={status}>{status}</option>)}
        </Select>
        <Button icon={advancedOpen ? 'expand_less' : 'tune'} onClick={() => setAdvancedOpen((current) => !current)} type="button" variant="secondary">
          {advancedOpen ? 'Ocultar' : 'Filtros'}
        </Button>
      </div>

      {advancedOpen ? (
        <div className="grid gap-3 rounded-xl bg-surface-container-low p-3">
          <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
            <Select label="Imagen" name="hasImage" onChange={(event) => onChange('hasImage', event.target.value)} value={filters.hasImage}>
              <option value="all">Todos</option>
              <option value="yes">Con imagen</option>
              <option value="no">Sin imagen</option>
            </Select>
            <Input inputMode="decimal" label="Precio min." maxLength="9" name="minPrice" onChange={(event) => onChange('minPrice', event.target.value)} onInput={limitDecimal(6, 2)} value={filters.minPrice} />
            <Input inputMode="decimal" label="Precio max." maxLength="9" name="maxPrice" onChange={(event) => onChange('maxPrice', event.target.value)} onInput={limitDecimal(6, 2)} value={filters.maxPrice} />
            <Input inputMode="numeric" label="Stock min." maxLength="6" name="minStock" onChange={(event) => onChange('minStock', event.target.value)} onInput={limitInteger(6)} value={filters.minStock} />
            <Input inputMode="numeric" label="Stock max." maxLength="6" name="maxStock" onChange={(event) => onChange('maxStock', event.target.value)} onInput={limitInteger(6)} value={filters.maxStock} />
          </div>

          <div className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <Select label="Ordenar por" name="sortBy" onChange={(event) => onChange('sortBy', event.target.value)} value={filters.sortBy}>
              <option value="name">Nombre</option>
              <option value="price">Precio</option>
              <option value="stock">Stock</option>
              <option value="category">Categoria</option>
              <option value="brand">Marca</option>
              <option value="purchaseDate">Fecha</option>
              <option value="cost">Costo</option>
              <option value="profit">Ganancia</option>
            </Select>
            <Select label="Direccion" name="sortDirection" onChange={(event) => onChange('sortDirection', event.target.value)} value={filters.sortDirection}>
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </Select>
            <div className="flex min-w-0 flex-wrap gap-2">
              {canExport ? (
                <>
                  <Button onClick={() => onExport('json')} type="button" variant="secondary">JSON</Button>
                  <Button onClick={() => onExport('csv')} type="button" variant="secondary">CSV</Button>
                  <Button onClick={() => onExport('excel')} type="button" variant="secondary">Excel</Button>
                  <Button onClick={() => onExport('pdf')} type="button" variant="secondary">PDF</Button>
                </>
              ) : null}
              {canImport ? (
                <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-outline-variant bg-white px-4 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container-low sm:w-auto">
                  Importar
                  <input accept=".json,.csv" className="hidden" onChange={onImport} type="file" />
                </label>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {selectedCount && canBulk ? (
        <div className="grid gap-2 rounded-xl bg-surface-container-low p-3 sm:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] sm:items-center">
          <span className="text-sm font-bold text-on-surface-variant">{selectedCount} seleccionados</span>
          <Button onClick={onDuplicate} type="button" variant="secondary">Duplicar</Button>
          <Button onClick={onRemoveSelected} type="button" variant="danger">Eliminar</Button>
          <Select label="" onChange={(event) => event.target.value && onBulkCategory(event.target.value)} value="">
            <option value="">Cambiar categoria</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </Select>
          <Select label="" onChange={(event) => event.target.value && onBulkStatus(event.target.value)} value="">
            <option value="">Cambiar estado</option>
            {productStatuses.map((status) => <option key={status}>{status}</option>)}
          </Select>
        </div>
      ) : null}
    </div>
  )
}
