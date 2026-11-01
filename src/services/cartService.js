import { apiClient, IS_SUPABASE } from '../config/api'
import { normalizeProduct } from './gunService'

// ---------------------------------------------------------------------------
// CartService — Shopping cart (keranjang belanja).
// Stores cart in Supabase (cart table) when available, localStorage otherwise.
// ---------------------------------------------------------------------------

const LOCAL_CART_KEY = 'bore_barrel_cart'

const getLocalCart = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || '[]')
  } catch { return [] }
}

const setLocalCart = (items) => {
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items))
  } catch { /* ignore */ }
}

class CartService {
  async getCart(userId) {
    if (IS_SUPABASE && userId) {
      try {
        const data = await apiClient.get(
          `/rest/v1/cart?user_id=eq.${userId}&select=*,products(*)`
        )
        const items = Array.isArray(data)
          ? data.map((row) => ({
              cartId: row.id,
              quantity: row.quantity,
              product: normalizeProduct(row.products),
            }))
          : []
        return { success: true, data: items }
      } catch {
        // fallback to local
      }
    }
    // localStorage fallback
    return { success: true, data: getLocalCart() }
  }

  async addToCart(userId, product, quantity = 1) {
    if (IS_SUPABASE && userId) {
      try {
        // Check if already in cart
        const existing = await apiClient.get(
          `/rest/v1/cart?user_id=eq.${userId}&product_id=eq.${product.id}&select=*`
        )
        if (Array.isArray(existing) && existing.length > 0) {
          const newQty = existing[0].quantity + quantity
          await apiClient.patch(
            `/rest/v1/cart?id=eq.${existing[0].id}`,
            { quantity: newQty },
            { headers: { Prefer: 'return=minimal' } }
          )
        } else {
          await apiClient.post(
            '/rest/v1/cart',
            { user_id: userId, product_id: product.id, quantity },
            { headers: { Prefer: 'return=minimal' } }
          )
        }
        return { success: true }
      } catch (err) {
        return { success: false, message: err.message }
      }
    }
    // localStorage fallback
    const cart = getLocalCart()
    const idx = cart.findIndex((i) => i.product?.id === product.id)
    if (idx >= 0) {
      cart[idx].quantity += quantity
    } else {
      cart.push({ product, quantity, cartId: `local-${Date.now()}` })
    }
    setLocalCart(cart)
    return { success: true }
  }

  async updateQty(userId, cartId, quantity) {
    if (IS_SUPABASE && userId) {
      try {
        await apiClient.patch(
          `/rest/v1/cart?id=eq.${cartId}`,
          { quantity },
          { headers: { Prefer: 'return=minimal' } }
        )
        return { success: true }
      } catch (err) {
        return { success: false, message: err.message }
      }
    }
    const cart = getLocalCart()
    const idx = cart.findIndex((i) => i.cartId === cartId)
    if (idx >= 0) cart[idx].quantity = quantity
    setLocalCart(cart)
    return { success: true }
  }

  async removeFromCart(userId, cartId, productId) {
    if (IS_SUPABASE && userId) {
      try {
        await apiClient.delete(`/rest/v1/cart?id=eq.${cartId}`)
        return { success: true }
      } catch (err) {
        return { success: false, message: err.message }
      }
    }
    const cart = getLocalCart().filter(
      (i) => i.cartId !== cartId && i.product?.id !== productId
    )
    setLocalCart(cart)
    return { success: true }
  }

  async clearCart(userId) {
    if (IS_SUPABASE && userId) {
      try {
        await apiClient.delete(`/rest/v1/cart?user_id=eq.${userId}`)
        return { success: true }
      } catch (err) {
        return { success: false, message: err.message }
      }
    }
    setLocalCart([])
    return { success: true }
  }
}

export default new CartService()
