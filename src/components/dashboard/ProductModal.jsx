import { useRef, useState } from 'react'
import { productCategories, productStatuses, productUnits } from '../../data/dashboard'
import { useI18n } from '../../hooks/useI18n'
import { limitDecimal, limitInteger, limitText } from '../../utils/inputLimits'
import { createDefaultProduct } from '../../utils/productUtils'
import Button from '../atoms/Button'
import Input from '../atoms/Input'
import Select from '../atoms/Select'
import Modal from '../molecules/Modal'

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']

function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!allowedImageTypes.includes(file.type)) {
      reject(new Error('Formato no permitido. Usa JPG, PNG o WebP.'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

export default function ProductModal({ product, onClose, onSave, onToast }) {
  const { t } = useI18n()
  const isEditing = Boolean(product)
  const values = createDefaultProduct(product || {})
  const fileInputRef = useRef(null)
  const [image, setImage] = useState(values.image)
  const [imageName, setImageName] = useState(values.imageName)
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleFile = async (file) => {
    try {
      const imageBase64 = await readImage(file)
      setImage(imageBase64)
      setImageName(file.name)
    } catch (error) {
      onToast?.({ message: error.message, title: t('notifications.imageInvalid'), tone: 'error' })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    const formData = new FormData(event.currentTarget)

    try { await onSave({
      ...values,
      barcode: formData.get('barcode'),
      brand: formData.get('brand'),
      category: formData.get('category'),
      color: formData.get('color'),
      cost: Number(formData.get('cost')),
      description: formData.get('description'),
      expirationDate: formData.get('expirationDate'),
      id: product?.id || values.id,
      image,
      imageName,
      location: formData.get('location'),
      minStock: Number(formData.get('minStock')),
      model: formData.get('model'),
      name: formData.get('name'),
      notes: formData.get('notes'),
      price: Number(formData.get('price')),
      purchaseDate: formData.get('purchaseDate'),
      sku: formData.get('sku'),
      status: formData.get('status'),
      stock: Number(formData.get('stock')),
      supplier: formData.get('supplier'),
      tax: Number(formData.get('tax')),
      unit: formData.get('unit'),
      usageType: formData.get('usageType'),
      updatedAt: new Date().toISOString(),
      weight: formData.get('weight'),
    }) } finally { setSaving(false) }
  }

  return (
    <Modal onClose={onClose} title={isEditing ? t('products.editProduct') : t('inventory.actions.addProduct')}>
      <form className="grid min-w-0 gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]" onSubmit={handleSubmit}>
        <div className="min-w-0">
          <label className="mb-2 block text-sm font-bold text-on-surface-variant">{t('products.image')}</label>
          <button
            className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center text-sm font-bold transition ${
              dragging ? 'border-primary bg-surface-container' : 'border-outline-variant bg-surface-container-low text-outline'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragLeave={() => setDragging(false)}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              const file = event.dataTransfer.files?.[0]
              if (file) handleFile(file)
            }}
            type="button"
          >
            {image ? (
              <img alt={t('products.imagePreview')} className="h-full w-full object-cover" src={image} />
            ) : (
              <span>Placeholder 160 x 160</span>
            )}
          </button>
          <input
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) handleFile(file)
            }}
            ref={fileInputRef}
            type="file"
          />
          <div className="mt-3 grid gap-2">
            <Button icon="upload" onClick={() => fileInputRef.current?.click()} type="button" variant="secondary">
              {image ? t('products.changeImage') : t('products.uploadImage')}
            </Button>
            {image ? (
              <Button icon="delete" onClick={() => { setImage(''); setImageName('') }} type="button" variant="ghost">
                {t('products.deleteImage')}
              </Button>
            ) : null}
            <p className="text-xs leading-5 text-on-surface-variant">{t('products.imageHelp')}</p>
          </div>
        </div>

        <div className="grid min-w-0 gap-4">
          <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
            <Input defaultValue={values.name} label={`${t('products.name')} *`} maxLength="80" name="name" onInput={limitText(80)} placeholder={t('forms.placeholder.product')} required />
            <Input defaultValue={values.sku} label={`${t('products.sku')} *`} maxLength="24" name="sku" onInput={limitText(24)} placeholder={t('forms.placeholder.sku')} required />
            <Input defaultValue={values.barcode} inputMode="numeric" label={t('products.barcode')} maxLength="14" name="barcode" onInput={limitInteger(14)} />
            <Select defaultValue={values.category} label={t('products.category')} name="category">
              {productCategories.map((category) => <option key={category}>{category}</option>)}
            </Select>
            <Input defaultValue={values.brand} label={t('products.brand')} maxLength="50" name="brand" onInput={limitText(50)} />
            <Input defaultValue={values.supplier} label={t('products.supplier')} maxLength="60" name="supplier" onInput={limitText(60)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))]">
            <Input defaultValue={values.cost} inputMode="decimal" label={t('products.cost')} maxLength="9" name="cost" onInput={limitDecimal(6, 2)} />
            <Input defaultValue={values.price} inputMode="decimal" label={t('products.price')} maxLength="9" name="price" onInput={limitDecimal(6, 2)} />
            <Input defaultValue={values.tax} inputMode="numeric" label={t('products.tax')} maxLength="3" name="tax" onInput={limitInteger(3)} />
            <Input defaultValue={values.stock} inputMode="numeric" label={t('products.stock')} maxLength="6" name="stock" onInput={limitInteger(6)} />
            <Input defaultValue={values.minStock} inputMode="numeric" label={t('products.minStock')} maxLength="6" name="minStock" onInput={limitInteger(6)} />
            <Input defaultValue={values.weight} label={t('products.weight')} maxLength="20" name="weight" onInput={limitText(20)} placeholder="500 g" />
            <Select defaultValue={values.unit} label={t('products.unit')} name="unit">
              {productUnits.map((unit) => <option key={unit}>{unit}</option>)}
            </Select>
            <Select defaultValue={values.status} label={t('products.status')} name="status">
              {productStatuses.map((status) => <option key={status}>{status}</option>)}
            </Select>
            <Select defaultValue={values.usageType || 'retail'} label="Uso del producto" name="usageType">
              <option value="clinical">Insumo clínico</option><option value="retail">Producto vendible</option><option value="medication">Medicamento cobrable</option><option value="equipment">Equipo no consumible</option>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
            <Input defaultValue={values.purchaseDate} label={t('products.purchaseDate')} name="purchaseDate" type="date" />
            <Input defaultValue={values.expirationDate} label={t('products.expirationDate')} name="expirationDate" type="date" />
            <Input defaultValue={values.location} label={t('products.location')} maxLength="60" name="location" onInput={limitText(60)} />
            <Input defaultValue={values.color} label={t('products.color')} maxLength="30" name="color" onInput={limitText(30)} />
            <Input defaultValue={values.model} label={t('products.model')} maxLength="50" name="model" onInput={limitText(50)} />
          </div>

          <label className="grid gap-1.5 text-sm font-bold text-on-surface-variant">
            {t('products.description')}
            <textarea className="min-h-24 w-full resize-none rounded-xl border border-outline-variant px-3 py-2.5 text-sm font-normal text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" defaultValue={values.description} maxLength="280" name="description" />
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-on-surface-variant">
            {t('products.notes')}
            <textarea className="min-h-20 w-full resize-none rounded-xl border border-outline-variant px-3 py-2.5 text-sm font-normal text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" defaultValue={values.notes} maxLength="240" name="notes" />
          </label>

        </div>
        <div className="sticky bottom-0 z-20 -mx-4 -mb-4 flex flex-col-reverse gap-3 border-t border-outline-variant bg-white/95 px-4 py-3 shadow-[0_-12px_28px_rgba(31,24,39,0.08)] backdrop-blur sm:-mx-5 sm:-mb-5 sm:flex-row sm:justify-end sm:px-5 lg:col-span-2">
          <Button className="sm:min-w-32" disabled={saving} onClick={onClose} type="button" variant="secondary">{t('actions.cancel')}</Button>
          <Button className="sm:min-w-44" disabled={saving} type="submit">{saving ? 'Guardando...' : isEditing ? t('actions.saveChanges') : t('inventory.actions.addProduct')}</Button>
        </div>
      </form>
    </Modal>
  )
}
