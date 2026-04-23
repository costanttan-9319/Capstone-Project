import React, { useEffect, useState } from "react";
import api from "../services/api";
import useAuth from "../hooks/useAuth";
import LoginCard from "../components/LoginCard";
import StoreCard from "../components/StoreCard";

// ==================== FAVOURITE PAGE ====================
const Favourite = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==================== FETCH FAVOURITE STORES ====================
  useEffect(() => {
    if (!user) return;

    const fetchFavourites = async () => {
      try {
        const response = await api.get("/stores/favourites");
        setStores(response.data);
      } catch (error) {
        console.error("Error fetching favourites:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFavourites();
  }, [user]);

  // ==================== NOT LOGGED IN ====================
  if (!user) {
    return (
      <div className="login-container">
        <LoginCard />
      </div>
    );
  }

  // ==================== LOADING ====================
  if (loading) {
    return <div className="loading-container">Loading your favourites...</div>;
  }

  // ==================== RENDER ====================
  return (
    <>
      <style>{`
        .favourite-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 2rem;
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .favourite-title {
          font-size: 2.2rem;
          color: #d81473;
          margin-bottom: 3rem;
          text-align: center;
          display: inline-block;
          padding-bottom: 0.5rem;
        }

        .no-favourites {
          text-align: center;
          margin-top: 5rem;
          color: #888;
          font-size: 1.2rem;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 50vh;
          color: #d81473;
          font-weight: 500;
        }
      `}</style>

      <div className="favourite-container">
        <h1 className="favourite-title">My Favourites</h1>
        {stores.length === 0 ? (
          <p className="no-favourites">You haven't added any favourites yet.</p>
        ) : (
          <div className="store-grid">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Favourite;