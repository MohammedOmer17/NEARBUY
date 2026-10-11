import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { cartApi } from '../services/api'
import { getErrorMessage } from '../services/apiClient'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

const CartContext = createContext(null)
const EMPTY = { shopId: null, shopName: '', items: [] }

export function CartProvider({ children }) {
  const { customer } = useAuth()
  const toast = useToast()
  const [cart, setCart] = useState(EMPTY)
  const [ready, setReady] = useState(false) // false until the first cart fetch for this session finishes
  const [busy, setBusy] = useState({})
  const [conflict, setConflict] = useState(null) // { product, quantity, resolve }

  const refresh = useCallback(async () => {
    try {
      setCart(await cartApi.get())
    } catch (e) {
      if (e.response?.status === 404) setCart(EMPTY)
      else toast.error(getErrorMessage(e, 'Could not load your cart.'))
    }
  }, [toast])

  useEffect(() => {
    setReady(false)
    if (!customer) { setCart(EMPTY); return }
    refresh().finally(() => setReady(true))
  }, [customer?._id, customer?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const mark = (id, on) => setBusy((b) => ({ ...b, [id]: on }))

  const doAdd = useCallback(async (product, quantity) => {
    mark(product.id, true)
    try {
      await cartApi.add(product.id, quantity)
      await refresh()
      return true
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not add this item.'))
      return false
    } finally {
      mark(product.id, false)
    }
  }, [refresh, toast])

  // One cart = one shop. Never clear silently: ask first.
  const add = useCallback((product, quantity = 1) => {
    const differentShop = cart.items.length > 0 && cart.shopId && product.shopId && String(cart.shopId) !== String(product.shopId)
    if (differentShop) return new Promise((resolve) => setConflict({ product, quantity, resolve }))
    return doAdd(product, quantity)
  }, [cart, doAdd])

  const resolveConflict = async (replace) => {
    const c = conflict
    setConflict(null)
    if (!replace) return c.resolve(false)
    try {
      await cartApi.clear()
      setCart(EMPTY)
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not clear your cart.'))
      return c.resolve(false)
    }
    c.resolve(await doAdd(c.product, c.quantity))
  }

  const remove = useCallback(async (productId) => {
    const prev = cart
    setCart((c) => ({ ...c, items: c.items.filter((i) => i.productId !== productId) }))
    try { await cartApi.remove(productId); await refresh() }
    catch (e) { setCart(prev); toast.error(getErrorMessage(e, 'Could not remove this item.')) }
  }, [cart, refresh, toast])

  const setQty = useCallback(async (productId, quantity) => {
    if (quantity <= 0) return remove(productId)
    const prev = cart
    setCart((c) => ({ ...c, items: c.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)) }))
    try { await cartApi.update(productId, quantity); await refresh() }
    catch (e) { setCart(prev); toast.error(getErrorMessage(e, 'Could not update quantity.')) }
  }, [cart, refresh, remove, toast])

  const clear = useCallback(async () => {
    try { await cartApi.clear(); setCart(EMPTY) }
    catch (e) { toast.error(getErrorMessage(e, 'Could not clear your cart.')) }
  }, [toast])

  const value = useMemo(() => ({
    cart, loading: !ready, refresh, add, setQty, remove, clear,
    isBusy: (id) => !!busy[id],
    quantityOf: (id) => cart.items.find((i) => i.productId === id)?.quantity || 0,
    itemCount: cart.items.reduce((n, i) => n + i.quantity, 0),
    // Display estimate only. The backend calculates the real order total.
    estimatedTotal: cart.items.reduce((n, i) => n + i.price * i.quantity, 0),
  }), [cart, ready, busy, refresh, add, setQty, remove, clear])

  return (
    <CartContext.Provider value={value}>
      {children}
      <Modal open={!!conflict} onClose={() => resolveConflict(false)} title="Start a new cart?"
        footer={(
          <>
            <Button full onClick={() => resolveConflict(true)}>Clear cart and add</Button>
            <Button full variant="ghost" onClick={() => resolveConflict(false)}>Keep my cart</Button>
          </>
        )}>
        <p>Your cart has items from {cart.shopName || 'another shop'}. A cart can hold items from one shop only, so adding {conflict?.product.name} will clear it.</p>
      </Modal>
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
