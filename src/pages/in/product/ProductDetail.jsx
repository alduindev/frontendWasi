import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Button from '../../../components/atoms/Button'
import Card from '../../../components/atoms/Card'
import ConfirmDialog from '../../../components/molecules/ConfirmDialog'
import DashboardShell from '../../../components/organisms/DashboardShell'
import ProductModal from '../../../components/organisms/ProductModal'
import { useAuth } from '../../../context/authStore'
import { formatCurrency, getProductProfit } from '../../../data/dashboard'
import { useInventory } from '../../../hooks/useInventory'
import { useToast } from '../../../hooks/useToast'
import { getHistory } from '../../../services/historyApi'
import { getPermissions } from '../../../services/permissionService'

export default function ProductDetail() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const permissions = useMemo(() => getPermissions(user), [user])
  const inventory = useInventory(user?.name)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [history, setHistory] = useState([])
  const product = inventory.products.find((item) => item.id === productId)

  useEffect(() => {
    let active = true
    getHistory().then((entries) => { if (active) setHistory(entries.filter((entry) => entry.productId === productId).slice(0, 8)) }).catch(() => {})
    return () => { active = false }
  }, [productId])

  if (inventory.isLoading) return <DashboardShell title="Producto"><Card className="p-6">Cargando producto...</Card></DashboardShell>
  if (!product) return <Navigate to="/dashboard" replace />

  const detailRows = [
    ['SKU', product.sku],
    ['Codigo de barras', product.barcode || 'No registrado'],
    ['Marca', product.brand || 'Sin marca'],
    ['Proveedor', product.supplier || 'Sin proveedor'],
    ['Categoria', product.category],
    ['Estado', product.status],
    ['Costo', formatCurrency(product.cost)],
    ['Precio', formatCurrency(product.price)],
    ['Ganancia', formatCurrency(getProductProfit(product))],
    ['IVA', `${product.tax}%`],
    ['Peso', product.weight || 'No registrado'],
    ['Unidad', product.unit],
    ['Compra', product.purchaseDate || 'Sin fecha'],
    ['Vencimiento', product.expirationDate || 'No aplica'],
    ['Ubicacion', product.location || 'Sin ubicacion'],
    ['Color', product.color || 'No registrado'],
    ['Modelo', product.model || 'No registrado'],
  ]

  return (
    <DashboardShell title={product.name} subtitle="Detalle completo del producto, stock e historial.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]">
        <Card className="p-4 sm:p-5">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low text-sm font-bold text-outline">
            {product.image ? <img alt={product.name} className="h-full w-full object-cover" src={product.image} /> : 'Placeholder 640 x 640'}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((item) => (
              <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-outline-variant text-xs font-bold text-outline" key={item}>
                160 x 160
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-2">
            {permissions.canEditProducts ? <Button icon="edit" onClick={() => setModalOpen(true)} type="button">Editar</Button> : null}
            {permissions.canBulkManageProducts ? (
              <Button
                icon="content_copy"
                onClick={async () => {
                  try {
                    await inventory.duplicateByIds([product.id])
                    showToast({ title: 'Producto duplicado', tone: 'success' })
                  } catch (requestError) {
                    showToast({ message: requestError.message, title: 'No se pudo duplicar', tone: 'error' })
                  }
                }}
                type="button"
                variant="secondary"
              >
                Duplicar
              </Button>
            ) : null}
            {permissions.canDeleteProducts ? <Button icon="delete" onClick={() => setConfirmOpen(true)} type="button" variant="danger">Eliminar</Button> : null}
          </div>
        </Card>

        <div className="grid min-w-0 gap-5">
          <Card className="p-4 sm:p-5">
            <h2 className="font-heading text-xl font-bold text-on-surface">Informacion completa</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
              {detailRows.map(([label, value]) => (
                <div className="rounded-xl bg-surface-container-low p-3" key={label}>
                  <p className="text-xs font-bold uppercase text-on-surface-variant">{label}</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">{value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="font-heading text-xl font-bold text-on-surface">Stock y movimiento</h2>
            <p className="mt-3 text-3xl font-bold text-primary">{product.stock} unidades</p>
            <p className="mt-1 text-sm text-on-surface-variant">Minimo recomendado: {product.minStock}</p>
            <p className="mt-4 text-sm leading-6 text-on-surface-variant">{product.description || 'Sin descripcion.'}</p>
            {product.notes ? <p className="mt-2 text-sm leading-6 text-on-surface-variant">Observaciones: {product.notes}</p> : null}
          </Card>

          <Card className="p-4 sm:p-5">
            <h2 className="font-heading text-xl font-bold text-on-surface">Historial</h2>
            <div className="mt-4 grid gap-3">
              {history.length ? history.map((entry) => (
                <div className="rounded-xl border border-outline-variant p-3" key={entry.id}>
                  <p className="text-sm font-bold text-on-surface">{entry.action}</p>
                  <p className="text-xs text-on-surface-variant">{new Date(entry.createdAt).toLocaleString('es-PE')} / {entry.user}</p>
                </div>
              )) : <p className="text-sm text-on-surface-variant">Aun no hay historial para este producto.</p>}
            </div>
          </Card>
        </div>
      </div>

      {modalOpen && permissions.canEditProducts ? (
        <ProductModal
          onClose={() => setModalOpen(false)}
          onSave={async (nextProduct) => {
            try {
              await inventory.editProduct(nextProduct)
              setModalOpen(false)
              showToast({ title: 'Producto actualizado', tone: 'success' })
            } catch (requestError) {
              showToast({ message: requestError.message, title: 'No se pudo actualizar', tone: 'error' })
            }
          }}
          onToast={showToast}
          product={product}
        />
      ) : null}
      <ConfirmDialog
        description="Se eliminara este producto y volveras al inventario."
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          try {
            await inventory.removeProducts([product.id])
            navigate('/dashboard')
            showToast({ title: 'Producto eliminado', tone: 'warning' })
          } catch (requestError) {
            showToast({ message: requestError.message, title: 'No se pudo eliminar', tone: 'error' })
          }
        }}
        open={confirmOpen}
        title="Eliminar producto"
      />
    </DashboardShell>
  )
}
