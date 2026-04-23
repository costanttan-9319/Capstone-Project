import { Review } from '../models/reviewModel.js';

// ==================== REVIEW CONTROLLER ====================
export const ReviewController = {

  // ==================== CREATE OR UPDATE REVIEW ====================
  async submitReview(req, res) {
    try {
      const { store_id, rating, price_rating, comment } = req.body;
      const user_id = req.user.id;

      if (!store_id || !rating) {
        return res.status(400).json({ error: 'Store ID and rating are required' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      await Review.create({
        user_id,
        store_id,
        rating,
        price_rating,
        comment
      });

      // Get updated average rating
      const averageData = await Review.getAverageRating(store_id);

      res.json({
        message: 'Review submitted successfully',
        average_rating: averageData.average,
        review_count: averageData.count
      });
    } catch (err) {
      console.error('Submit review error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== GET REVIEW FOR A STORE (BY CURRENT USER) ====================
  async getUserReview(req, res) {
    try {
      const { store_id } = req.params;
      const user_id = req.user.id;

      const review = await Review.getByUserAndStore(user_id, store_id);
      res.json(review || null);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== GET ALL REVIEWS FOR A STORE ====================
  async getStoreReviews(req, res) {
    try {
      const { store_id } = req.params;
      const reviews = await Review.getByStoreId(store_id);
      const averageData = await Review.getAverageRating(store_id);

      res.json({
        reviews,
        average_rating: averageData.average,
        review_count: averageData.count
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== DELETE REVIEW ====================
  async deleteReview(req, res) {
    try {
      const { store_id } = req.params;
      const user_id = req.user.id;

      const deleted = await Review.delete(user_id, store_id);
      if (!deleted) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.json({ message: 'Review deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};