import { useEffect, useState } from 'react'
import { ArrowUpRight, ShoppingBasket } from 'lucide-react'
import { shopOwnerApi } from '../../services/api'
import PageHeader from '../../components/shared/PageHeader'
import { formatCurrency } from '../../utils/format'

export default function OwnerSalesPage() {
  const [summary, setSummary] = useState(null)
  const [stats, setStats] = useState(null)
  const [trends, setTrends] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([
      shopOwnerApi.salesSummary(),
      shopOwnerApi.salesStatistics(),
      shopOwnerApi.salesTrends('daily'),
      shopOwnerApi.topProducts(),
    ])
      .then(([summaryRes, statsRes, trendsRes, topProductsRes]) => {
        if (!alive) return
        setSummary(summaryRes?.summary ?? null)
        setStats(statsRes?.statistics ?? null)
        setTrends(Array.isArray(trendsRes?.trendData) ? trendsRes.trendData : (Array.isArray(trendsRes?.trends) ? trendsRes.trends : []))
        setTopProducts(Array.isArray(topProductsRes?.products) ? topProductsRes.products : (Array.isArray(topProductsRes?.topProducts) ? topProductsRes.topProducts : []))
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setLoading(false)
      })

    return () => { alive = false }
  }, [])

  return (
    <div>
      <PageHeader title="Sales" back={false} />
      <div className="space-y-4 p-4">
        {loading ? (
          <p className="text-sm text-mute">Loading sales data…</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-card">
                <p className="text-sm text-mute">Revenue</p>
                <p className="mt-2 text-2xl font-bold">{formatCurrency(summary?.totalSales ?? 0)}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-card">
                <p className="text-sm text-mute">Avg. order</p>
                <p className="mt-2 text-2xl font-bold">{formatCurrency(summary?.averageOrderValue ?? 0)}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-card">
              <h2 className="text-lg font-bold">Performance</h2>
              <div className="mt-3 space-y-2 text-sm text-mute">
                <div className="flex justify-between"><span>Total orders</span><strong className="text-ink">{stats?.totalOrders ?? 0}</strong></div>
                <div className="flex justify-between"><span>Completed</span><strong className="text-ink">{stats?.completedOrders ?? 0}</strong></div>
                <div className="flex justify-between"><span>Pickup</span><strong className="text-ink">{stats?.pickupOrders ?? 0}</strong></div>
                <div className="flex justify-between"><span>Delivery</span><strong className="text-ink">{stats?.deliveryOrders ?? 0}</strong></div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-card">
              <h2 className="text-lg font-bold">Top products</h2>
              <div className="mt-3 space-y-2">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-mute">No sales data yet.</p>
                ) : (
                  topProducts.map((product, index) => (
                    <div key={product?._id || index} className="flex items-center justify-between rounded-xl bg-canvas p-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{index + 1}</div>
                        <div>
                          <p className="font-semibold text-ink">{product?.name || 'Product'}</p>
                          <p className="text-xs text-mute">{product?.category || 'General'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-ink">{formatCurrency(product?.totalRevenue ?? 0)}</p>
                        <p className="text-xs text-mute">{product?.quantitySold ?? 0} sold</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-card">
              <h2 className="text-lg font-bold">Trend summary</h2>
              <div className="mt-3 space-y-2 text-sm text-mute">
                {trends.length === 0 ? (
                  <p>No trend data available.</p>
                ) : (
                  trends.map((entry, index) => (
                    <div key={`${entry?.label || 'date'}-${index}`} className="flex items-center justify-between rounded-xl bg-canvas p-3">
                      <span>{entry?.label || `Point ${index + 1}`}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-ink">
                        <ArrowUpRight className="h-4 w-4 text-brand-600" /> {formatCurrency(entry?.value ?? 0)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
