import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import FavoriteIcon from "@mui/icons-material/Favorite";
import useAuth from "../hooks/useAuth";

const MobileNavBar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/login");
  };

  const navItems = [
    { label: "Home", path: "/" },
    { label: "TopPicks 🔥", path: "/top-picks" },
    { label: "MyStore", path: "/my-store" },
    { label: "", path: "/favourite", icon: <FavoriteIcon /> },
    { label: "Contact Us", path: "/contact" },
  ];
  
  if (user?.role === "admin") {
    navItems.push({ label: "Admin", path: "/admin-requests" });
  }

  const isLoggedIn = !!user;

  return (
    <>
      <style>{`
        /* ==================== MOBILE NAVBAR ==================== */
        .mobile-navbar {
          position: sticky;
          top: 0;
          background-color: white;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          padding: 0.75rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* ==================== MENU BUTTON ==================== */
        .menu-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #d81473;
          padding: 8px;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .menu-btn svg {
          font-size: 1.8rem;
        }
        .menu-btn:active {
          transform: scale(0.95);
        }

        /* ==================== LOGO ==================== */
        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .mobile-logo svg {
          font-size: 2rem;
          color: #d81473;
        }
        .mobile-logo span {
          font-size: 1.5rem;
          font-weight: bold;
          color: #d81473;
        }

        /* Spacer for alignment */
        .menu-spacer {
          width: 44px;
        }

        /* ==================== FULL SCREEN MENU OVERLAY ==================== */
        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: white;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }

        /* ==================== MENU HEADER ==================== */
        .menu-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #eee;
          background-color: white;
        }
        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #d81473;
          padding: 8px;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-btn svg {
          font-size: 1.8rem;
        }
        .close-btn:active {
          transform: scale(0.95);
        }
        .menu-header-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .menu-header-logo svg {
          font-size: 2rem;
          color: #d81473;
        }
        .menu-header-logo span {
          font-size: 1.5rem;
          font-weight: bold;
          color: #d81473;
        }

        /* ==================== MENU LINKS ==================== */
        .menu-links {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }
        .menu-link {
          display: block;
          padding: 14px 20px;
          font-size: 1rem;
          font-weight: 500;
          color: #333;
          text-decoration: none;
          transition: background 0.2s ease;
          border-bottom: 1px solid #f5f5f5;
        }
        .menu-link:active {
          background-color: #f0f0f0;
          color: #d81473;
        }
        .menu-link.active {
          color: #d81473;
          background-color: #fff0f6;
          border-left: 3px solid #d81473;
        }
        .menu-link span {
          margin-right: 8px;
        }

        /* ==================== PROFILE & LOGOUT ==================== */
        .menu-logout {
          background-color: #dc3545;
          color: white;
          border-radius: 8px;
          text-align: center;
          margin: 8px 16px 20px 16px;
          border: none;
          width: calc(100% - 32px);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          padding: 14px 20px;
        }
        .menu-logout:active {
          background-color: #b02a37;
          transform: scale(0.98);
        }

        /* Divider */
        .menu-divider {
          height: 1px;
          background-color: #eee;
          margin: 12px 20px;
        }
      `}</style>

      {/* Mobile Header Bar */}
      <div className="mobile-navbar">
        <button className="menu-btn" onClick={toggleMenu}>
          <MenuIcon />
        </button>
        <div className="mobile-logo" onClick={() => navigate("/")}>
          <RestaurantIcon />
          <span>EatWhere</span>
        </div>
        <div className="menu-spacer"></div>
      </div>

      {/* Full Screen Menu Overlay */}
      {menuOpen && (
        <div className="mobile-menu-overlay">
          <div className="menu-header">
            <div className="menu-spacer"></div>
            <div className="menu-header-logo" onClick={() => { navigate("/"); closeMenu(); }}>
              <RestaurantIcon />
              <span>EatWhere</span>
            </div>
            <button className="close-btn" onClick={closeMenu}>
              <CloseIcon />
            </button>
          </div>

          <div className="menu-links">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => isActive ? "menu-link active" : "menu-link"}
                onClick={closeMenu}
              >
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </NavLink>
            ))}
            
            {/* Profile link - handles both login and profile based on auth state */}
            <NavLink
              to={isLoggedIn ? "/profile" : "/login"}
              className={({ isActive }) => isActive ? "menu-link active" : "menu-link"}
              onClick={closeMenu}
            >
              Profile
            </NavLink>

            {/* Logout button - only shown when logged in */}
            {isLoggedIn && (
              <>
                <div className="menu-divider"></div>
                <button className="menu-logout" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavBar;