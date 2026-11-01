import { useState } from 'react'
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ExternalLink,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react'
import { useCart } from '../hooks/useCart'
import userService from '../services/userService'
import { formatPrice } from '../utils/helpers'
import LazyImage from '../components/common/LazyImage'

const WA_PHONE = '6281367936664' // 081367936664 in international WhatsApp format

export default function CartPage({ onBack, onNavigateCatalog }) {
  const { items, loading, updateQty, removeFromCart, clearCart } = useCart()
  const profile = userService.getUserProfile()

  const [notes, setNotes] = useState('')
  const [buyerName, setBuyerName] = useState(profile.username || 'Operator')

  // Calculate pricing
  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.product?.price ?? item.product?.cook_time ?? 0)
    return sum + price * (item.quantity || 1)
  }, 0)

  const handleCheckoutWA = () => {
    if (items.length === 0) return

    // Build the WhatsApp message format: "Hi aku mau pesan ...."
    let message = `Hi aku mau pesan:\n`
    items.forEach((item, index) => {
      const prodName = item.product?.name || 'Hardware Piece'
      const price = Number(item.product?.price ?? item.product?.cook_time ?? 0)
      const qty = item.quantity || 1
      const totalItem = formatPrice(price * qty)
      message += `${index + 1}. ${prodName} (x${qty}) - ${totalItem}\n`
    })

    message += `\n*Total Tagihan:* ${formatPrice(subtotal)}\n`
    message += `*Nama Pemesan:* ${buyerName.trim() || 'Operator'}\n`
    if (notes.trim()) {
      message += `*Catatan Khusus:* ${notes.trim()}\n`
    }
    message += `\nMohon informasi ketersediaan dan instruksi pengiriman/pengambilan. Terima kasih!`

    const waUrl = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Continue Browsing
        </button>
        <h1 className="display">Procurement Cart</h1>
        <p className="lede">
          Review selected armory inventory before issuing procurement order via WhatsApp direct dispatch.
        </p>
      </div>

      {loading ? (
        <div className="state-box">
          <p>Loading cart items…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="state-box">
          <ShoppingCart size={48} stroke="var(--brass)" />
          <h2>Your cart is empty</h2>
          <p>You have not staged any weapons or gear for procurement yet.</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onNavigateCatalog || onBack}
            style={{ marginTop: '12px' }}
          >
            Browse Armory Catalog
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items List */}
          <div className="cart-items-section">
            <div className="cart-items-head">
              <h2>Staged Equipment ({items.length})</h2>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={clearCart}
                title="Remove all items from cart"
              >
                <Trash2 size={14} /> Clear Cart
              </button>
            </div>

            <ul className="cart-items-list">
              {items.map((item) => {
                const prod = item.product || {}
                const price = Number(prod.price ?? prod.cook_time ?? 0)
                const itemTotal = price * (item.quantity || 1)

                return (
                  <li key={item.cartId || prod.id} className="cart-item-row">
                    <div className="cart-item-thumb">
                      <LazyImage
                        src={prod.image_url || prod.image || '/guns/pistol.svg'}
                        alt={prod.name}
                        width={80}
                        height={60}
                      />
                    </div>

                    <div className="cart-item-details">
                      <h3 className="cart-item-title">{prod.name}</h3>
                      <p className="cart-item-meta">
                        {prod.type || prod.category || 'Hardware'}
                        {prod.caliber ? ` · ${prod.caliber}` : ''}
                      </p>
                      <p className="cart-item-unit-price">
                        {formatPrice(price)} each
                      </p>
                    </div>

                    <div className="cart-item-qty">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateQty(item.cartId, item.quantity - 1)
                          } else {
                            removeFromCart(item.cartId, prod.id)
                          }
                        }}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="qty-number">{item.quantity || 1}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateQty(item.cartId, (item.quantity || 1) + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="cart-item-subtotal">
                      <span className="cart-subtotal-val">{formatPrice(itemTotal)}</span>
                    </div>

                    <button
                      type="button"
                      className="cart-item-del"
                      onClick={() => removeFromCart(item.cartId, prod.id)}
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Order Summary & WhatsApp Checkout */}
          <div className="cart-summary-section">
            <div className="cart-summary-card">
              <h3 className="summary-title">Order Dispatch Summary</h3>

              <div className="summary-row">
                <span>Equipment Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Armory Duty &amp; Handling</span>
                <span className="text-free">Included</span>
              </div>
              <div className="summary-row summary-total">
                <span>Total Procurement</span>
                <span className="total-highlight">{formatPrice(subtotal)}</span>
              </div>

              {/* Order fields */}
              <div className="checkout-fields">
                <label className="form-label" htmlFor="buyer-name">
                  Operator Callsign / Name
                </label>
                <input
                  id="buyer-name"
                  type="text"
                  className="form-input"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Your Name / Operator Alias"
                />

                <label className="form-label" htmlFor="order-notes" style={{ marginTop: '8px' }}>
                  Delivery / Armory Notes
                </label>
                <textarea
                  id="order-notes"
                  className="form-textarea"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Serial registration, optics package..."
                />
              </div>

              {/* Direct WhatsApp Checkout Button */}
              <button
                type="button"
                className="btn btn--whatsapp"
                onClick={handleCheckoutWA}
              >
                <MessageCircle size={20} />
                <span>Check-Out via WhatsApp</span>
                <ExternalLink size={16} />
              </button>

              <div className="whatsapp-info">
                <ShieldCheck size={16} stroke="var(--brass)" />
                <span>
                  Dispatches order to WhatsApp: <strong>0813-6793-6664</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
