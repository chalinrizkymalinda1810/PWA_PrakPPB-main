import { useState, useEffect, useCallback } from 'react'
import reviewService from '../services/reviewService'
import { getUserIdentifier } from '../services/userService'

// ---------------------------------------------------------------------------
// useReviews — fetch reviews for a specific product, supporting CRUD and votes.
// ---------------------------------------------------------------------------

export function useReviews(gunId) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const userId = getUserIdentifier()

  const fetchReviews = useCallback(async () => {
    if (!gunId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)

      const response = await reviewService.getReviews(gunId, userId)

      if (response.success) {
        setReviews(response.data || [])
      } else {
        setError(response.message || 'Failed to fetch reviews.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching reviews.')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [gunId, userId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const voteReview = async (reviewId, voteVal) => {
    await reviewService.voteReview(reviewId, userId, voteVal)
    await fetchReviews()
  }

  const updateReview = async (reviewId, data) => {
    const res = await reviewService.updateReview(reviewId, data)
    await fetchReviews()
    return res
  }

  const deleteReview = async (reviewId) => {
    const res = await reviewService.deleteReview(reviewId)
    await fetchReviews()
    return res
  }

  return { reviews, loading, error, refetch: fetchReviews, voteReview, updateReview, deleteReview }
}

// ---------------------------------------------------------------------------
// useCreateReview — submit a new review for a product.
// ---------------------------------------------------------------------------

export function useCreateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const createReview = async (gunId, reviewData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await reviewService.createReview(gunId, reviewData)

      if (response.success) {
        setSuccess(true)
        return response.data
      } else {
        setError(response.message || 'Failed to submit review.')
        return null
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting review.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createReview, loading, error, success }
}
