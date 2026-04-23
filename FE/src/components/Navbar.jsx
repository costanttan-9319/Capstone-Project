import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import useAuth from "../hooks/useAuth";
import "./Navbar.css";

// ==================== NAVBAR COMPONENT ====================
const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(!!user);

  useEffect(() => {
    setIsLoggedIn(!!user);
  }, [user]);

  // ==================== HANDLE LOGOUT ====================
  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    window.location.href = "/login";
  };

  // ==================== RENDER ====================
  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* LOGO */}
        <div className="nav-logo" onClick={() => navigate("/")}>
          <RestaurantIcon className="logo-icon" />
          <span className="logo-text">EatWhere</span>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Home
          </NavLink>
          
          <div className="top-picks-wrapper">
            <NavLink to="/top-picks" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              TopPicks
            </NavLink>
            <span className="fire-emoji">🔥</span>
          </div>

          <NavLink to="/my-store" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            MyStore
          </NavLink>

          <NavLink to="/favourite" className={({ isActive }) => isActive ? "fav-icon active" : "fav-icon"}>
            <FavoriteIcon />
          </NavLink>

          <NavLink to="/contact" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Contact Us
          </NavLink>

          {/* Admin only link */}
          {user?.role === "admin" && (
            <NavLink to="/admin-requests" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Admin
            </NavLink>
          )}

          {/* AUTH BUTTONS */}
          {!isLoggedIn ? (
            <NavLink to="/login" className={({ isActive }) => isActive ? "nav-link btn-login active" : "nav-link btn-login"}>
              Login
            </NavLink>
          ) : (
            <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-link btn-profile active" : "nav-link btn-profile"}>
              Profile
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;