import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/atoms/Button'
import Skeleton from '../../components/atoms/Skeleton'
import EmptyState from '../../components/molecules/EmptyState'
import ConfirmDialog from '../../components/molecules/ConfirmDialog'
import DashboardShell from '../../components/organisms/DashboardShell'
import InventoryToolbar from '../../components/organisms/InventoryToolbar'
import ProductList from '../../components/organisms/ProductList'
import ProductModal from '../../components/organisms/ProductModal'
import { useAuth } from '../../context/authStore'
import { useAppConfig } from '../../context/appConfigStore'
import { useInventory } from '../../hooks/useInventory'
import { useI18n } from '../../hooks/useI18n'
import { useToast } from '../../hooks/useToast'
import { getPermissions } from '../../services/permissionService'

const defaultFilters = {
  category: 'all',
  hasImage: 'all',
  maxPrice: '',
  maxStock: '',
  minPrice: '',
  minStock: '',
  query: '',
  sortBy: 'name',
  sortDirection: 'asc',
  status: 'all',
  stockStatus: 'all',
}

export default function Inventory() {
  const { user } = useAuth()
  const { config } = useAppConfig()
  const { t } = useI18n()
  const { showToast } = useToast()
  const permissions = useMemo(() => getPermissions(user), [user])
  const inventory = useInventory(user?.name)
  const [searchParams] = useSearchParams()
  const [confirm, setConfirm] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [filters, setFilters] = useState(defaultFilters)
  const [modalOpen, setModalOpen] = useState(false)
  const focusedProductId = searchParams.get('focus')

  const filteredProducts = useMemo(() => {
    const effectiveFilters = focusedProductId
      ? {
        ...filters,
        query: '',
        sortBy: 'createdAt',
        sortDirection: 'desc',
      }
      : filters
    const products = inventory.filterProducts(effectiveFilters)

    if (!focusedProductId) return products

    return products.toSorted((a, b) => {
      if (a.id === focusedProductId) return -1
      if (b.id === focusedProductId) return 1
      return 0
    })
  }, [filters, focusedProductId, inventory])

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  const openCreateModal = () => {
    if (!permissions.canCreateProducts) return
    setEditingProduct(null)
    setModalOpen(true)
  }

  const handleSaveProduct = async (product) => {
    try {
      if (editingProduct) {
        if (!permissions.canEditProducts) return
        await inventory.editProduct(product)
        showToast({ title: t('notifications.productUpdated'), tone: 'success' })
      } else {
        if (!permissions.canCreateProducts) return
        await inventory.addProduct(product)
        showToast({ title: t('notifications.productAdded'), tone: 'success' })
      }
      setEditingProduct(null)
      setModalOpen(false)
    } catch (requestError) {
      showToast({ message: requestError.message, title: 'No se pudo guardar', tone: 'error' })
    }
  }

  const requestDelete = (ids) => {
    if (!permissions.canDeleteProducts) {
      showToast({ message: t('errors.restrictedAction'), title: t('errors.restrictedTitle'), tone: 'warning' })
      return
    }

    setConfirm({
      description: t('inventory.confirmDeleteDescription', { count: ids.length }),
      onConfirm: async () => {
        try {
          await inventory.removeProducts(ids)
          showToast({ message: t('inventory.removedCount', { count: ids.length }), title: t('notifications.productDeleted'), tone: 'warning' })
          setConfirm(null)
        } catch (requestError) {
          showToast({ message: requestError.message, title: 'No se pudo eliminar', tone: 'error' })
        }
      },
      title: t('inventory.confirmDeleteTitle'),
    })
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const result = await inventory.importFile(file)
    showToast({
      message: result.message,
      title: result.ok ? t('notifications.importCompleted') : t('notifications.errorImport'),
      tone: result.ok ? 'success' : 'error',
    })
    event.target.value = ''
  }

  return (
    <DashboardShell
      action={permissions.canCreateProducts ? <Button icon="add" onClick={openCreateModal} type="button">{t('inventory.actions.addProduct')}</Button> : null}
      onSearch={(value) => updateFilter('query', value)}
      searchPlaceholder={t('inventory.searchPlaceholder')}
      searchValue={filters.query}
      subtitle={config?.template?.dashboardKey === 'hospitality' ? 'Productos de minibar, room service, amenities y suministros conectados al stock.' : t('inventory.subtitle')}
      title={config?.template?.dashboardKey === 'hospitality' ? 'Productos y almacén' : t('inventory.title')}
    >
      <InventoryToolbar
        filters={filters}
        onBulkCategory={async (category) => {
          await inventory.bulkUpdateSelected({ category })
          showToast({ title: t('inventory.toast.categoryUpdated'), tone: 'success' })
        }}
        onBulkStatus={async (status) => {
          await inventory.bulkUpdateSelected({ status })
          showToast({ title: t('inventory.toast.statusUpdated'), tone: 'success' })
        }}
        onChange={updateFilter}
        onDuplicate={async () => {
          await inventory.duplicateSelected()
          showToast({ title: t('inventory.toast.productsDuplicated'), tone: 'success' })
        }}
        onExport={(format) => (inventory.selectedIds.length ? inventory.exportSelected(format) : inventory.exportAll(format))}
        onImport={handleImport}
        onRemoveSelected={() => requestDelete(inventory.selectedIds)}
        permissions={permissions}
        selectedCount={inventory.selectedIds.length}
      />

      {inventory.isLoading ? <div className="grid gap-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div> : null}
      {!inventory.isLoading && inventory.error ? <EmptyState description={inventory.error} icon="cloud_off" title="No se pudo cargar el inventario" action={{ children: 'Reintentar', onClick: inventory.refresh, type: 'button' }} /> : null}
      {!inventory.isLoading && !inventory.error ? <ProductList
        canDelete={permissions.canDeleteProducts}
        canEdit={permissions.canEditProducts}
        canSelect={permissions.canBulkManageProducts}
        onDelete={(id) => requestDelete([id])}
        onEdit={(product) => {
          setEditingProduct(product)
          setModalOpen(true)
        }}
        onSelectAll={() => inventory.selectAll(filteredProducts.map((product) => product.id))}
        onToggleSelected={inventory.toggleSelected}
        products={filteredProducts}
        highlightedProductId={focusedProductId}
        selectedIds={inventory.selectedIds}
      /> : null}

      {modalOpen ? (
        <ProductModal
          onClose={() => setModalOpen(false)}
          onSave={handleSaveProduct}
          onToast={showToast}
          product={editingProduct}
        />
      ) : null}

      <ConfirmDialog
        description={confirm?.description}
        onCancel={() => setConfirm(null)}
        onConfirm={confirm?.onConfirm}
        open={Boolean(confirm)}
        title={confirm?.title}
      />
    </DashboardShell>
  )
}
