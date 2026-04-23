import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import api from "../services/api";
import StoreCard from "../components/StoreCard";
import EditStoreModal from "../components/EditStoreModal";
import "./pages.css";

const TopPicks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topPicks, setTopPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStore, setEditingStore] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const isAdmin = user?.role === "admin";

  // Fetch top picks from API
  const fetchTopPicks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/stores/top-picks");
      console.log("🎯 Top picks fetched:", response.data);
      setTopPicks(response.data);
    } catch (err) {
      console.error("❌ Error fetching top picks:", err);
      setError("Failed to load Top Picks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopPicks();
  }, []);

  // Handle edit store
  const handleEditClick = (store) => {
    setEditingStore(store);
    setIsEditModalOpen(true);
  };

  // Handle delete success
  const handleDeleteSuccess = (storeId) => {
    setTopPicks(prev => prev.filter(store => store.id !== storeId));
  };

  // Handle edit success
  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    fetchTopPicks(); // Refresh the list
  };

  // Handle toggle top pick (remove from top picks)
  const handleToggleTopPick = async (storeId, newStatus) => {
    if (!newStatus) {
      // If removed from top picks, refresh the list
      fetchTopPicks();
    }
  };

  if (loading) {
    return (
      <div className="top-picks-loading">
        <div className="loading-spinner"></div>
        <p>Loading top picks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="top-picks-error">
        <p>⚠️ {error}</p>
        <button onClick={fetchTopPicks} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* Top Picks Page - iPhone Friendly */
        .top-picks-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #fff9f0 0%, #ffffff 100%);
          padding-bottom: 40px;
        }

        /* ==================== HEADER ==================== */
        .top-picks-header {
          background: linear-gradient(135deg, #ffbe1b, #ff8c00);
          padding: 40px 20px;
          text-align: center;
          border-bottom-left-radius: 30px;
          border-bottom-right-radius: 30px;
          margin-bottom: 20px;
        }

        .top-picks-header-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .top-picks-title {
          font-size: 1.8rem;
          font-weight: bold;
          color: white;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .top-picks-title .star-icon {
          font-size: 2rem;
          animation: starPulse 2s infinite;
        }

        @keyframes starPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .top-picks-subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.95);
          margin: 0;
          line-height: 1.4;
        }

        .admin-hint {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.85);
          margin-top: 16px;
          background: rgba(0, 0, 0, 0.2);
          display: inline-block;
          padding: 8px 16px;
          border-radius: 30px;
        }

        /* ==================== COUNT BADGE ==================== */
        .top-picks-count {
          text-align: center;
          padding: 16px 20px;
          font-size: 0.9rem;
          color: #ff8c00;
          font-weight: 600;
          background: #fff3e0;
          margin: 0 16px 20px 16px;
          border-radius: 30px;
          display: inline-block;
          width: auto;
        }


/* ==================== GRID - Mobile (380px each) ==================== */
.top-picks-grid {
  display: grid;
  grid-template-columns: repeat(2, 380px);
  gap: 2rem;
  justify-content: center;
  margin: 0 auto;
  width: 100%;
}

/* Mobile: 1 card with breathing room */
@media (max-width: 850px) {
  .top-picks-grid {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 1.5rem;
  }
  
  .top-pick-card-wrapper {
    max-width: 330px;
    width: 100%;
  }
}

        /* ==================== CARD WRAPPER WITH RANK ==================== */
        .top-pick-card-wrapper {
          position: relative;
          animation: fadeInUp 0.5s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .top-pick-rank {
          position: absolute;
          top: -12px;
          left: -12px;
          background: linear-gradient(135deg, #ffbe1b, #ff8c00);
          color: white;
          font-size: 0.85rem;
          font-weight: bold;
          padding: 6px 12px;
          border-radius: 30px;
          z-index: 15;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(4px);
          border: 2px solid white;
        }

        /* ==================== LOADING STATE ==================== */
        .top-picks-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: 16px;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #ffbe1b;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .top-picks-loading p {
          color: #666;
          font-size: 0.95rem;
        }

        /* ==================== ERROR STATE ==================== */
        .top-picks-error {
          text-align: center;
          padding: 60px 20px;
          color: #d32f2f;
        }

        .retry-btn {
          margin-top: 16px;
          padding: 10px 24px;
          background: #ffbe1b;
          color: white;
          border: none;
          border-radius: 30px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .retry-btn:active {
          transform: scale(0.96);
        }

        /* ==================== EMPTY STATE ==================== */
        .top-picks-empty {
          text-align: center;
          padding: 60px 20px;
          max-width: 400px;
          margin: 0 auto;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .top-picks-empty h3 {
          font-size: 1.3rem;
          color: #333;
          margin-bottom: 12px;
        }

        .top-picks-empty p {
          color: #666;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .browse-btn {
          padding: 12px 28px;
          background: #ffbe1b;
          color: white;
          border: none;
          border-radius: 30px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .browse-btn:active {
          transform: scale(0.96);
        }

        /* ==================== TOUCH FRIENDLY ==================== */
        @media (max-width: 768px) {
          button, 
          .admin-btn,
          .review-btn,
          .carousel-arrow {
            min-height: 44px;
            min-width: 44px;
          }
          
          .top-pick-rank {
            font-size: 0.75rem;
            padding: 4px 10px;
            top: -8px;
            left: -8px;
          }
        }

        /* ==================== SAFE AREA FOR NOTCH ==================== */
        @supports (padding: max(0px)) {
          .top-picks-header {
            padding-top: max(40px, env(safe-area-inset-top));
            padding-left: max(20px, env(safe-area-inset-left));
            padding-right: max(20px, env(safe-area-inset-right));
          }
          
          .top-picks-page {
            padding-bottom: max(40px, env(safe-area-inset-bottom));
          }
        }
      `}</style>
      
      <div className="top-picks-page">
        {/* Header Section */}
        <div className="top-picks-header">
          <div className="top-picks-header-content">
            <h1 className="top-picks-title">
              <span className="star-icon">⭐</span>
              Top 10 Must Eat in Singapore
              <span className="star-icon">⭐</span>
            </h1>
            <p className="top-picks-subtitle">
              Hand-picked by our community. The absolute best spots you cannot miss!
            </p>
            {isAdmin && (
              <p className="admin-hint">
                👑 Admin: Click the star on any card to add/remove from Top Picks
              </p>
            )}
          </div>
        </div>

        {/* Results Section */}
        {topPicks.length === 0 ? (
          <div className="top-picks-empty">
            <div className="empty-icon">🍽️</div>
            <h3>No Top Picks Yet</h3>
            <p>
              {isAdmin 
                ? "Click the star button on any store card to add it to Top Picks!"
                : "Check back soon for our curated list of must-eat spots!"}
            </p>
            {!isAdmin && (
              <button onClick={() => navigate("/")} className="browse-btn">
                Browse Stores
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="top-picks-count">
              Showing {topPicks.length} amazing {topPicks.length === 1 ? "spot" : "spots"}
            </div>
            <div className="top-picks-grid">
              {topPicks.map((store, index) => (
                <div key={store.id} className="top-pick-card-wrapper">
                  <div className="top-pick-rank">#{index + 1}</div>
                  <StoreCard
                    store={store}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteSuccess}
                    onToggleTopPick={handleToggleTopPick}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Edit Modal */}
        <EditStoreModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          store={editingStore}
          onSuccess={handleEditSuccess}
        />
      </div>
    </>
  );
};

export default TopPicks;