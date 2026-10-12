import { useEffect, useState } from 'react'
import { Plus, Trash2, PackagePlus } from 'lucide-react'
import { shopOwnerApi } from '../../services/api'
import PageHeader from '../../components/shared/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { formatCurrency } from '../../utils/format'

const DEFAULT_FORM = {
  name: '',
  category: '',
  price: '',
  unit: 'kg',
  quantity: '',
  description: '',
}

export default function OwnerProductsPage() {
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [error, setError] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      const profile = await shopOwnerApi.me()
      const nextShop = profile?.shop ?? null
      setShop(nextShop)
      if (nextShop?._id) {
        const nextProducts = await shopOwnerApi.listProducts(nextShop._id)
        setProducts(nextProducts)
      }
      setError('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const updateField = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!shop?._id) return

    try {
      await shopOwnerApi.createProduct({
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        unit: form.unit.trim(),
        quantity: Number(form.quantity),
        description: form.description.trim(),
      })
      setForm(DEFAULT_FORM)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to create product.')
    }
  }

  const handleDelete = async (productId) => {
    try {
      await shopOwnerApi.deleteProduct(productId)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete product.')
    }
  }

  const handleStockUpdate = async (productId, newQuantity) => {
    try {
      await shopOwnerApi.updateStock(productId, Math.max(0, Number(newQuantity)))
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update stock.')
    }
  }

  return (
    <div>
      <PageHeader title="Products" back={false} />
      <div className="space-y-4 p-4">
        {error && <p role="alert" className="rounded-xl bg-danger-50 p-3 text-sm font-medium text-danger">{error}</p>}

        <form onSubmit={handleCreate} className="rounded-2xl bg-white p-4 shadow-card space-y-3">
          <div className="flex items-center gap-2 text-lg font-bold"><PackagePlus className="h-5 w-5 text-brand-600" /> Add product</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Name" value={form.name} onChange={updateField('name')} placeholder="Tomatoes" />
            <Input label="Category" value={form.category} onChange={updateField('category')} placeholder="Vegetables" />
            <Input label="Price" type="number" min="0" step="0.01" value={form.price} onChange={updateField('price')} placeholder="45" />
            <Input label="Unit" value={form.unit} onChange={updateField('unit')} placeholder="kg" />
            <Input label="Stock" type="number" min="0" step="1" value={form.quantity} onChange={updateField('quantity')} placeholder="12" />
            <Input label="Description" value={form.description} onChange={updateField('description')} placeholder="Fresh produce" />
          </div>
          <Button type="submit" full><Plus className="h-4 w-4" />Create</Button>
        </form>

        {loading ? (
          <p className="text-sm text-mute">Loading products…</p>
        ) : products.length === 0 ? (
          <div className="rounded-2xl bg-white p-4 text-sm text-mute shadow-card">No products listed yet.</div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product._id} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">{product.name}</h3>
                    <p className="text-sm text-mute">{product.category} • {product.unit}</p>
                  </div>
                  <button type="button" onClick={() => handleDelete(product._id)} className="rounded-full p-2 text-danger hover:bg-danger-50" aria-label="Delete product">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-mute">
                  <span>Price</span>
                  <strong className="text-ink">{formatCurrency(product.price || 0)}</strong>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-mute">
                  <span>Stock</span>
                  <strong className="text-ink">{product.quantity ?? 0}</strong>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="soft" onClick={() => handleStockUpdate(product._id, (Number(product.quantity) || 0) + 1)}>+1</Button>
                  <Button size="sm" variant="outline" onClick={() => handleStockUpdate(product._id, Math.max(0, (Number(product.quantity) || 0) - 1))}>-1</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
