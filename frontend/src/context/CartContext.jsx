import { createContext, useContext, useState, useEffect } from 'react'
import { cartAPI } from '../api/axios'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(false)

  const fetchCart = async () => {
    if (!isAuthenticated) return
    try {
      setLoading(true)
      const res = await cartAPI.get()
      setCart(res.data.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (isAuthenticated) fetchCart()
    else setCart({ items: [], total: 0 })
  }, [isAuthenticated])

  const addToCart = async (productId, quantity = 1, variantId = null) => {
    try {
      const res = await cartAPI.addItem({ product_id: productId, quantity, variant_id: variantId })
      setCart(res.data.data)
      toast.success('Added to cart!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add')
    }
  }

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await cartAPI.updateItem(itemId, { quantity })
      setCart(res.data.data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update')
    }
  }

  const removeItem = async (itemId) => {
    try {
      const res = await cartAPI.removeItem(itemId)
      setCart(res.data.data)
      toast.success('Item removed')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove')
    }
  }

  const clearCart = async () => {
    try {
      await cartAPI.clear()
      setCart({ items: [], total: 0 })
    } catch { /* ignore */ }
  }

  const itemCount = cart.items?.reduce((sum, i) => sum + i.quantity, 0) || 0

  return (
    <CartContext.Provider value={{
      cart, loading, addToCart, updateQuantity, removeItem, clearCart, fetchCart, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
