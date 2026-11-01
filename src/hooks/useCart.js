import { useState, useEffect, useCallback } from 'react'
import cartService from '../services/cartService'
import { getUserIdentifier } from '../services/userService'

// ---------------------------------------------------------------------------
// useCart — manage the shopping cart state.
// ---------------------------------------------------------------------------
export function useCart() {
  const userId = getUserIdentifier()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    setLoading(true)
    try {
      const res = await cartService.getCart(userId)
      if (res.success) setItems(res.data || [])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchCart() }, [fetchCart])

  const totalCount = items.reduce((s, i) => s + (i.quantity || 1), 0)

  const addToCart = async (product, qty = 1) => {
    await cartService.addToCart(userId, product, qty)
    await fetchCart()
  }

  const updateQty = async (cartId, qty) => {
    await cartService.updateQty(userId, cartId, qty)
    await fetchCart()
  }

  const removeFromCart = async (cartId, productId) => {
    await cartService.removeFromCart(userId, cartId, productId)
    await fetchCart()
  }

  const clearCart = async () => {
    await cartService.clearCart(userId)
    setItems([])
  }

  return { items, loading, totalCount, addToCart, updateQty, removeFromCart, clearCart, refetch: fetchCart }
}
