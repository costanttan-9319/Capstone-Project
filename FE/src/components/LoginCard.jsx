import React, { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import api from "../services/api";
import "./LoginCard.css";

// ==================== LOGIN CARD COMPONENT ====================
const LoginCard = ({ onSuccess, onSwitchToSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  // ==================== HANDLE LOGIN ====================
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      login(token, user);

      // ==================== ADMIN PENDING REQUESTS ALERT ====================
      if (user.role === "admin") {
        try {
          const pendingResponse = await api.get(
            "/admin/requests/pending-count",
          );
          const count = pendingResponse.data.count;
          if (count > 0) {
            alert(
              `You have ${count} pending ownership request${count !== 1 ? "s" : ""}.`,
            );
          }
        } catch (err) {
          console.error("Failed to fetch pending count:", err);
        }
      }

      // ==================== OWNER REQUEST STATUS ALERT ====================
      if (user.role === "owner") {
        try {
          const requestsResponse = await api.get("/ownership/my-requests");
          const requests = requestsResponse.data;
          
          // Only get requests that are NOT notified yet (using !r.notified to handle 0)
          const unnotifiedRequests = requests.filter(
            (r) =>
              (r.status === "approved" || r.status === "rejected") &&
              !r.notified
          );
          
          const approvedCount = unnotifiedRequests.filter(
            (r) => r.status === "approved"
          ).length;
          const rejectedCount = unnotifiedRequests.filter(
            (r) => r.status === "rejected"
          ).length;
          
          if (approvedCount > 0 || rejectedCount > 0) {
            let message = "";
            if (approvedCount > 0 && rejectedCount > 0) {
              message = `You have ${approvedCount} approved and ${rejectedCount} rejected ownership requests.`;
            } else if (approvedCount > 0) {
              message = `You have ${approvedCount} approved ownership request${approvedCount !== 1 ? "s" : ""}.`;
            } else if (rejectedCount > 0) {
              message = `You have ${rejectedCount} rejected ownership request${rejectedCount !== 1 ? "s" : ""}.`;
            }
            alert(message);
            
            // Mark these requests as notified
            const unnotifiedIds = unnotifiedRequests.map((r) => r.id);
            await api.post("/ownership/mark-notified", { ids: unnotifiedIds });
          }
        } catch (err) {
          console.error("Failed to fetch request status:", err);
        }
      }

      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="login-card">
      <h1 className="login-title">WELCOME!</h1>
      <p className="login-subtitle">Sign in to continue</p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-input"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-links">
          <Link to="/forgot-password" className="forgot-link">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="signup-link">
        Don't have an account?{" "}
        <button
          className="link-button"
          onClick={
            onSwitchToSignup || (() => (window.location.href = "/signup"))
          }
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

export default LoginCard;