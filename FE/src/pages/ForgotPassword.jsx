import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

// ==================== FORGOT PASSWORD PAGE ====================
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // ==================== HANDLE SUBMIT ====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  // ==================== CLOSE MODAL ====================
  const handleClose = () => {
    navigate("/login");
  };

  // ==================== RENDER ====================
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {!submitted ? (
          <>
            <h2 className="modal-title">Reset Password</h2>
            <p className="modal-subtitle">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="modal-form">
              <input
                type="email"
                className="modal-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="modal-btn" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="success-icon">📧</div>
            <h2 className="modal-title">Check your email</h2>
            <p className="modal-subtitle">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <button onClick={handleClose} className="modal-btn">
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;