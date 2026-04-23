import React from "react";
import LoginCard from "./LoginCard";
import "./LoginModal.css";  // ← Import modal styles

// ==================== LOGIN MODAL ====================
const LoginModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        <LoginCard onSuccess={onSuccess} />
      </div>
    </div>
  );
};

export default LoginModal;