import { useState } from 'react'
import {
  ArrowLeft,
  Star,
  Send,
  Loader,
  Share2,
  ShoppingCart,
  Check,
  Archive,
  Trash2,
  Edit,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  X,
  Plus,
  Minus,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import LazyImage from '../common/LazyImage'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import { useCart } from '../../hooks/useCart'
import { getUserIdentifier } from '../../services/userService'
import { formatPrice, averageRating } from '../../utils/helpers'

/**
 * Full-screen product detail view with multi-image gallery,
 * reviews CRUD, thumbs up/down, add to cart, and share link.
 */
export default function GunDetail({ gun, onBack, onEdit, onArchive, onDelete }) {
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Multiple Images Resolution (Requirement #9)
  const images = Array.isArray(gun.images) && gun.images.length > 0
    ? gun.images
    : [gun.image_url || gun.image || '/guns/pistol.svg']
  const [activeImgIndex, setActiveImgIndex] = useState(0)
  const currentImage = images[activeImgIndex] || images[0]

  // Cart (Requirement #8)
  const { addToCart } = useCart()
  const [cartQty, setCartQty] = useState(1)
  const [addedCart, setAddedCart] = useState(false)

  // Share (Requirement #2)
  const [copiedShare, setCopiedShare] = useState(false)

  // Reviews & Voting (Requirement #7)
  const currentUserId = getUserIdentifier()
  const {
    reviews,
    loading: reviewsLoading,
    refetch: refetchReviews,
    voteReview,
    updateReview,
    deleteReview,
  } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Inline editing review state
  const [editingRevId, setEditingRevId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [updatingRev, setUpdatingRev] = useState(false)

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  // Share Unique Link
  const handleShare = async () => {
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
        // Fallback to clipboard
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

  // Add to cart
  const handleAddToCart = async () => {
    await addToCart(gun, cartQty)
    setAddedCart(true)
    setTimeout(() => setAddedCart(false), 2000)
  }

  // Submit new review
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const result = await createReview(gun.id, {
      user_id: currentUserId,
      user_identifier: currentUserId,
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Review submitted successfully!')
      setComment('')
      setRating(5)
      refetchReviews()
    } else {
      setReviewError('Could not submit review.')
    }
  }

  // Start editing a review
  const handleStartEdit = (rev) => {
    setEditingRevId(rev.id)
    setEditRating(rev.rating)
    setEditComment(rev.comment || '')
  }

  // Save edited review
  const handleSaveEdit = async (revId) => {
    try {
      setUpdatingRev(true)
      await updateReview(revId, {
        rating: editRating,
        comment: editComment.trim(),
      })
      setEditingRevId(null)
    } catch (err) {
      alert('Failed to update review: ' + err.message)
    } finally {
      setUpdatingRev(false)
    }
  }

  // Delete review
  const handleDeleteReview = async (revId) => {
    if (window.confirm('Delete this review?')) {
      await deleteReview(revId)
    }
  }

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
        {/* MULTIPLE IMAGES GALLERY (Requirement #9) */}
        <div className="detail-gallery-container">
          <div className="detail-main-img-wrap">
            <LazyImage
              className="detail-img"
              src={currentImage}
              alt={gun.name}
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="gallery-nav-btn prev"
                  onClick={() =>
                    setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                  }
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="gallery-nav-btn next"
                  onClick={() =>
                    setActiveImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                  }
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="gallery-thumbnails">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`gallery-thumb-btn ${idx === activeImgIndex ? 'active' : ''}`}
                  onClick={() => setActiveImgIndex(idx)}
                >
                  <img src={img} alt={`${gun.name} ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info & Purchase Area */}
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          {/* Add to Cart Stepper & CTA (Requirement #8) */}
          <div className="detail-cart-box">
            <div className="cart-qty-picker">
              <button
                type="button"
                className="qty-btn"
                onClick={() => setCartQty((q) => Math.max(1, q - 1))}
              >
                <Minus size={14} />
              </button>
              <span className="qty-number">{cartQty}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setCartQty((q) => q + 1)}
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              type="button"
              className={`btn btn--primary detail-cart-btn ${addedCart ? 'btn--success' : ''}`}
              onClick={handleAddToCart}
            >
              {addedCart ? (
                <><Check size={16} /> Added to Cart</>
              ) : (
                <><ShoppingCart size={16} /> Add to Cart ({formatPrice(price * cartQty)})</>
              )}
            </button>
          </div>

          {/* Floating Actions (Share, Edit, Archive, Delete) */}
          <div className="detail-actions">
            <FavoriteButton gunId={gun.id || gun.name} />

            {/* Share Unique Link (Requirement #2) */}
            <button
              type="button"
              className="btn btn--outline"
              onClick={handleShare}
              title="Share unique link"
            >
              {copiedShare ? (
                <><Check size={15} color="var(--brass)" /> Link Copied!</>
              ) : (
                <><Share2 size={15} /> Share Link</>
              )}
            </button>

            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                <Edit size={15} /> Edit
              </button>
            )}

            {/* Archive / Soft Delete (Requirement #6) */}
            {onArchive && (
              <button
                type="button"
                className="btn btn--outline btn--archive"
                onClick={() => onArchive(gun)}
                title="Arsipkan senjata (Soft Delete)"
              >
                <Archive size={15} /> Arsipkan
              </button>
            )}

            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>
                <Trash2 size={15} /> Delete Permanen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Steps */}
      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>
                {step.instruction || step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* REVIEWS & THUMBS UP/DOWN SECTION (Requirement #7) */}
      <section className="detail-section">
        <h2>Reviews &amp; Field Reports</h2>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a field review or operational assessment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !gun.id}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> Submit Field Review</>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
        </form>

        {/* Existing reviews with CRUD & Thumbs Up/Down (Requirement #7) */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading field reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => {
              const isEditing = editingRevId === rev.id

              return (
                <li key={rev.id} className="review-item">
                  {isEditing ? (
                    /* Inline Edit Form (UPDATE) */
                    <div className="review-edit-box">
                      <div className="review-stars" style={{ marginBottom: '8px' }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="star-btn"
                            onClick={() => setEditRating(n)}
                          >
                            <Star
                              size={18}
                              fill={n <= editRating ? 'var(--brass)' : 'none'}
                              stroke={n <= editRating ? 'var(--brass)' : 'var(--steel)'}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="review-input"
                        rows="2"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                      />
                      <div className="review-edit-actions">
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() => setEditingRevId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => handleSaveEdit(rev.id)}
                          disabled={updatingRev}
                        >
                          {updatingRev ? 'Saving…' : 'Save Update'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Review Display with Thumbs Up/Down and Edit/Delete */
                    <>
                      <div className="review-head">
                        <div className="review-user-info">
                          <span className="review-user">{rev.user_identifier || 'Operator'}</span>
                          <span className="review-stars-display">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                size={14}
                                fill={i < rev.rating ? 'var(--brass)' : 'none'}
                                stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                              />
                            ))}
                          </span>
                        </div>

                        {/* Review Action Controls: Edit & Delete */}
                        <div className="review-crud-btns">
                          <button
                            type="button"
                            className="review-btn-icon"
                            onClick={() => handleStartEdit(rev)}
                            title="Edit Review"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            className="review-btn-icon danger"
                            onClick={() => handleDeleteReview(rev.id)}
                            title="Delete Review"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {rev.comment && <p className="review-comment">{rev.comment}</p>}

                      {/* Thumbs Up / Thumbs Down Voting (Requirement #7) */}
                      <div className="review-vote-row">
                        <button
                          type="button"
                          className={`vote-btn ${rev.userVote === 1 ? 'voted-up' : ''}`}
                          onClick={() => voteReview(rev.id, 1)}
                          title="Thumbs up / helpful"
                        >
                          <ThumbsUp size={14} />
                          <span>{rev.thumbsUp || 0}</span>
                        </button>

                        <button
                          type="button"
                          className={`vote-btn ${rev.userVote === -1 ? 'voted-down' : ''}`}
                          onClick={() => voteReview(rev.id, -1)}
                          title="Thumbs down"
                        >
                          <ThumbsDown size={14} />
                          <span>{rev.thumbsDown || 0}</span>
                        </button>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="detail-empty">No field reviews yet. Be the first to review this hardware!</p>
        )}
      </section>
    </div>
  )
}
