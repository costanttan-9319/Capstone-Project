import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../services/api";

// ==================== RESET PASSWORD PAGE ====================
const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ==================== GET TOKEN FROM URL ====================
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Invalid or missing reset token");
    }
  }, [location]);

  // ==================== HANDLE RESET PASSWORD ====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword,
      });
      setMessage("Password reset successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // ==================== HANDLE RETRY ====================
  const handleRetry = () => {
    setError("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <h1 className="reset-title">Reset Password</h1>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        {!message && (
          <form onSubmit={handleSubmit} className="reset-form">
            <input
              type="password"
              className="reset-input"
              placeholder="New Password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              type="password"
              className="reset-input"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button 
              type={error ? "button" : "submit"} 
              className="reset-btn" 
              onClick={error ? handleRetry : null}
              disabled={loading}
            >
              {loading ? "Resetting..." : error ? "Retry" : "Reset Password"}
            </button>
            <Link to="/forgot-password" className="back-link">
              ← Request new reset link
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;