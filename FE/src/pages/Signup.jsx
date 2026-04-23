import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "./pages.css";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    date_of_birth: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.date_of_birth || !formData.password || !formData.confirmPassword) {
      setError("All fields are required");
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 alphanumeric characters");
      return false;
    }
    
    // Check for alphanumeric (letters and numbers only)
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(formData.password)) {
      setError("Password must contain only letters and numbers (no special characters)");
      return false;
    }
    
    // Validate date format DD/MM/YYYY
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!dateRegex.test(formData.date_of_birth)) {
      setError("Date of birth must be in DD/MM/YYYY format");
      return false;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const response = await api.post("/auth/signup", {
        username: formData.username,
        email: formData.email,
        date_of_birth: formData.date_of_birth,
        password: formData.password
      });
      
      // Save token to localStorage
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      
      // Force refresh and navigate to home
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <h1 className="reset-title">WELCOME!</h1>
        <p className="signup-subtitle">Create your account</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form className="reset-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            className="reset-input"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
          />
          
          <input
            type="text"
            name="date_of_birth"
            className="reset-input"
            placeholder="Birthdate (DD/MM/YYYY)"
            value={formData.date_of_birth}
            onChange={handleChange}
            disabled={loading}
          />
          
          <input
            type="email"
            name="email"
            className="reset-input"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
          />
          
          <input
            type="password"
            name="password"
            className="reset-input"
            placeholder="Password (min 6 alphanumeric)"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
          />
      
          
          <input
            type="password"
            name="confirmPassword"
            className="reset-input"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
          />
          
          <button 
            type="submit" 
            className="reset-btn" 
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
        
        <div className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;