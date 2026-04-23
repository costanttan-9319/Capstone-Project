import React, { useState} from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import api from "../services/api";

// ==================== PROFILE PAGE ====================
const Profile = () => {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { logout } = useAuth();

// ==================== HANDLE LOGOUT ====================
const handleLogout = () => {
  logout();
  window.location.href = "/";
};

  // ==================== HANDLE CHANGE PASSWORD ====================
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await api.post("/auth/change-password", { oldPassword, newPassword });
      setMessage("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordModal(false);
        setMessage("");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password");
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1 className="profile-title">My Profile</h1>

        <div className="profile-actions">
          <button className="profile-btn change-pwd-btn" onClick={() => setShowPasswordModal(true)}>
            Change Password
          </button>
          <button className="profile-btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Change Password</h2>
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
            <form onSubmit={handleChangePassword} className="modal-form">
              <input type="password" className="modal-input" placeholder="Current Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
              <input type="password" className="modal-input" placeholder="New Password (min 6 characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <input type="password" className="modal-input" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <button type="submit" className="modal-btn">Update Password</button>
              <button type="button" className="modal-btn cancel-btn" onClick={() => setShowPasswordModal(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;