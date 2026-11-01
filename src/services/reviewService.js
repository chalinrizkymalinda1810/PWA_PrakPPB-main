import { apiClient, IS_SUPABASE } from '../config/api'

// ---------------------------------------------------------------------------
// ReviewService — product reviews & ratings with CRUD & Thumbs Up/Down.
// Supports both Supabase (public.reviews, review_votes) and local storage.
// ---------------------------------------------------------------------------

const LOCAL_VOTES_KEY = 'bore_barrel_review_votes'

function getLocalVotes() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_VOTES_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveLocalVotes(votes) {
  try {
    localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(votes))
  } catch {
    /* ignore */
  }
}

class ReviewService {
  /**
   * Fetch all reviews for a given product with votes attached.
   */
  async getReviews(gunId, currentUserId = null) {
    let reviewsList = []

    if (IS_SUPABASE) {
      try {
        const data = await apiClient.get(
          `/rest/v1/reviews?product_id=eq.${gunId}&select=*&order=created_at.desc`,
        )
        if (Array.isArray(data)) {
          reviewsList = data.map((r) => ({
            id: r.id,
            product_id: r.product_id,
            user_id: r.user_id,
            user_identifier: r.user_id ? `Operator ${String(r.user_id).substring(0, 8)}` : 'Anonymous',
            rating: r.rating,
            comment: r.comment || '',
            created_at: r.created_at,
          }))
        }
      } catch (err) {
        console.warn('Failed to load reviews from Supabase:', err)
      }
    } else {
      try {
        const res = await apiClient.get(`/api/v1/recipes/${gunId}/reviews`)
        if (res && Array.isArray(res.data)) {
          reviewsList = res.data
        }
      } catch (err) {
        console.warn('Failed to load reviews from API:', err)
      }
    }

    // Attach votes (from Supabase if table exists, or local storage fallback)
    const localVotes = getLocalVotes()

    return {
      success: true,
      data: reviewsList.map((rev) => {
        const voteMap = localVotes[rev.id] || {} // { userId: 1 | -1 }
        let thumbsUp = 0
        let thumbsDown = 0
        let myVote = 0

        Object.entries(voteMap).forEach(([uid, val]) => {
          if (val === 1) thumbsUp++
          else if (val === -1) thumbsDown++
          if (currentUserId && uid === currentUserId) myVote = val
        })

        return {
          ...rev,
          thumbsUp,
          thumbsDown,
          userVote: myVote,
        }
      }),
    }
  }

  /**
   * Submit a new review (CREATE).
   */
  async createReview(gunId, reviewData) {
    if (IS_SUPABASE) {
      const payload = {
        product_id: Number(gunId),
        user_id: reviewData.user_id || reviewData.user_identifier,
        rating: Number(reviewData.rating),
        comment: reviewData.comment || '',
      }

      const res = await apiClient.post('/rest/v1/reviews', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      return { success: true, data: created }
    }

    return apiClient.post(`/api/v1/recipes/${gunId}/reviews`, reviewData)
  }

  /**
   * Edit an existing review (UPDATE).
   */
  async updateReview(reviewId, reviewData) {
    if (IS_SUPABASE) {
      const res = await apiClient.patch(
        `/rest/v1/reviews?id=eq.${reviewId}`,
        {
          rating: Number(reviewData.rating),
          comment: reviewData.comment,
        },
        { headers: { Prefer: 'return=representation' } },
      )
      return { success: true, data: Array.isArray(res) ? res[0] : res }
    }

    return apiClient.put(`/api/v1/recipes/${reviewId}`, reviewData)
  }

  /**
   * Delete a review (DELETE).
   */
  async deleteReview(reviewId) {
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/reviews?id=eq.${reviewId}`)
      return { success: true }
    }

    return apiClient.delete(`/api/v1/recipes/${reviewId}`)
  }

  /**
   * Cast a vote (Thumbs up: +1, Thumbs down: -1).
   * Toggles off if the same vote is clicked again.
   */
  async voteReview(reviewId, userId, voteValue) {
    const localVotes = getLocalVotes()
    if (!localVotes[reviewId]) {
      localVotes[reviewId] = {}
    }

    const currentVote = localVotes[reviewId][userId] || 0
    let newVote = voteValue
    if (currentVote === voteValue) {
      // Toggle off
      newVote = 0
      delete localVotes[reviewId][userId]
    } else {
      localVotes[reviewId][userId] = voteValue
    }
    saveLocalVotes(localVotes)

    // Also attempt Supabase review_votes if available
    if (IS_SUPABASE) {
      try {
        if (newVote === 0) {
          await apiClient.delete(`/rest/v1/review_votes?review_id=eq.${reviewId}&user_id=eq.${userId}`)
        } else {
          await apiClient.post(
            '/rest/v1/review_votes',
            { review_id: reviewId, user_id: userId, vote: newVote },
            { headers: { Prefer: 'resolution=merge-duplicates' } }
          )
        }
      } catch {
        // Fallback already saved locally
      }
    }

    return { success: true, newVote }
  }
}

export default new ReviewService()
