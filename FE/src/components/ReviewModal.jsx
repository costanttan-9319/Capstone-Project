import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./ReviewModal.css";

// ==================== REVIEW MODAL ====================
const ReviewModal = ({ isOpen, onClose, storeId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [priceRating, setPriceRating] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingReview, setExistingReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const PRICE_OPTIONS = [
    "$1-10 /pax",
    "$10-30 /pax",
    "$30-50 /pax",
    "$50-80 /pax",
    "$80-120 /pax",
    ">$120 /pax"
  ];

  // ==================== FETCH EXISTING REVIEW ====================
  useEffect(() => {
    if (!isOpen || !storeId) return;

    const fetchReview = async () => {
      try {
        const response = await api.get(`/reviews/user/${storeId}`);
        if (response.data) {
          setExistingReview(response.data);
          setRating(response.data.rating);
          setPriceRating(response.data.price_rating || "");
          setComment(response.data.comment || "");
        }
      } catch (err) {
        console.error("Error fetching review:", err);
      }
    };
    fetchReview();
  }, [isOpen, storeId]);

  // ==================== RESET FORM ====================
  const resetForm = () => {
    setRating(0);
    setPriceRating("");
    setComment("");
    setError("");
    setExistingReview(null);
  };

  // ==================== HANDLE CLOSE ====================
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ==================== HANDLE SUBMIT ====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await api.post("/reviews", {
        store_id: storeId,
        rating,
        price_rating: priceRating,
        comment
      });

      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== HANDLE DELETE ====================
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;

    setSubmitting(true);
    try {
      await api.delete(`/reviews/${storeId}`);
      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay" onClick={handleClose}>
      <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="review-modal-close" onClick={handleClose}>✕</button>
        
        <h2 className="review-modal-title">
          {existingReview ? "Edit Your Review" : "Write a Review"}
        </h2>

        {error && <div className="review-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="review-rating-section">
            <label className="review-label">Food Rating</label>
            <div className="review-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`review-star ${star <= (hoverRating || rating) ? "active" : ""}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Price Rating */}
          <div className="review-price-section">
            <label className="review-label">Price Rating</label>
            <select
              className="review-select"
              value={priceRating}
              onChange={(e) => setPriceRating(e.target.value)}
            >
              <option value="">Select price range</option>
              {PRICE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Comment */}
          <div className="review-comment-section">
            <label className="review-label">Comment (Optional)</label>
            <textarea
              className="review-textarea"
              rows="4"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="review-buttons">
            <button type="submit" className="review-submit-btn" disabled={submitting}>
              {submitting ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
            </button>
            
            {existingReview && (
              <button type="button" className="review-delete-btn" onClick={handleDelete} disabled={submitting}>
                Delete Review
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;