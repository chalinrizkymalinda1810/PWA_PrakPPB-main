import { useState } from 'react'
import { Share2, ShoppingCart, Check, Archive, Trash2, Edit, Layers } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import LazyImage from '../common/LazyImage'
import { formatPrice, truncate } from '../../utils/helpers'
import { useCart } from '../../hooks/useCart'

/**
 * Product card used in the catalog grid.
 *
 * @param {Object}   props
 * @param {Object}   props.gun        — product data
 * @param {Function} props.onSelect   — called with the gun when clicked
 * @param {Function} [props.onEdit]   — called when Edit is clicked
 * @param {Function} [props.onArchive]— called when Archive / Soft Delete is clicked
 * @param {Function} [props.onDelete] — called when Delete is clicked
 */
export default function GunCard({ gun, onSelect, onEdit, onArchive, onDelete }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  const { addToCart } = useCart()
  const [copiedShare, setCopiedShare] = useState(false)
  const [addedCart, setAddedCart] = useState(false)

  const imagesCount = Array.isArray(gun.images) ? gun.images.length : (gun.image_url ? 1 : 0)

  // Share Unique Link (Requirement #2)
  const handleShare = async (e) => {
    e.stopPropagation()
    const shareUrl = `${window.location.origin}/?gun=${gun.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${gun.name} — Bore & Barrel`,
          text: `Check out ${gun.name} (${category} · ${caliber}) at Bore & Barrel Armory:`,
          url: shareUrl,
        })
        return
      } catch {
        // User cancelled or share failed, fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2000)
    } catch {
      alert(`Unique link: ${shareUrl}`)
    }
  }

  // Quick Add to Cart (Requirement #8)
  const handleAddToCart = async (e) => {
    e.stopPropagation()
    await addToCart(gun, 1)
    setAddedCart(true)
    setTimeout(() => setAddedCart(false), 1800)
  }

  return (
    <li className="card">
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(gun)}
        aria-label={`View ${gun.name}`}
      >
        <div className="card-img-wrap">
          <LazyImage
            className="card-img"
            src={imgSrc}
            alt={gun.name}
            width={240}
            height={180}
          />
          {imagesCount > 1 && (
            <span className="card-images-badge" title={`${imagesCount} photos available`}>
              <Layers size={12} /> {imagesCount}
            </span>
          )}
        </div>

        <span className="name display">{gun.name}</span>

        <span className="type">
          {category}
          {caliber ? ` · ${caliber}` : ''}
        </span>

        {gun.description && (
          <span className="card-desc">{truncate(gun.description, 72)}</span>
        )}

        <div className="card-bottom-row">
          <span className="price">{formatPrice(price)}</span>

          {/* Quick Add To Cart Button */}
          <button
            type="button"
            className={`btn-quick-cart ${addedCart ? 'added' : ''}`}
            onClick={handleAddToCart}
            title="Tambah ke Keranjang"
            aria-label="Add to cart"
          >
            {addedCart ? <Check size={14} /> : <ShoppingCart size={14} />}
            <span>{addedCart ? 'Added' : '+ Cart'}</span>
          </button>
        </div>
      </button>

      {/* Floating actions row */}
      <div className="card-actions">
        <FavoriteButton gunId={gun.id || gun.name} />

        {/* Share Link Button (Requirement #2) */}
        <button
          type="button"
          className="card-act-btn"
          onClick={handleShare}
          aria-label={`Share ${gun.name}`}
          title="Share Unique Link"
        >
          {copiedShare ? <Check size={15} color="var(--brass)" /> : <Share2 size={15} />}
        </button>

        {onEdit && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(gun)
            }}
            aria-label={`Edit ${gun.name}`}
            title="Edit"
          >
            <Edit size={14} />
          </button>
        )}

        {/* Archive / Soft-delete Button (Requirement #6) */}
        {onArchive && (
          <button
            type="button"
            className="card-act-btn card-act-btn--archive"
            onClick={(e) => {
              e.stopPropagation()
              onArchive(gun)
            }}
            aria-label={`Archive ${gun.name}`}
            title="Arsipkan (Soft Delete)"
          >
            <Archive size={14} />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="card-act-btn card-act-btn--danger"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(gun)
            }}
            aria-label={`Delete ${gun.name}`}
            title="Delete Permanen"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </li>
  )
}
