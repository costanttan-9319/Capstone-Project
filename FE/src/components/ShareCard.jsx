import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import StoreCard from "./StoreCard";

const ShareCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/stores/${id}`);
        setStore(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching store:", err);
        setError("Store not found");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStore();
    }
  }, [id]);

  return (
    <>
      <style>{`
        .share-card-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .share-card-wrapper {
          max-width: 500px;
          width: 100%;
          margin: 0 auto;
        }

        .back-home-btn {
          background: none;
          border: none;
          color: #d81473;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          padding: 12px 20px;
          margin-bottom: 2rem;
          display: inline-block;
          position: absolute;
          top: 20px;
          left: 20px;
          background-color: white;
          border-radius: 30px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          min-height: 44px;
        }

        .back-home-btn:hover {
          background-color: #f0f0f0;
        }

        .back-home-btn:active {
          transform: scale(0.98);
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #d81473;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          text-align: center;
          color: #d32f2f;
        }

        @media (max-width: 768px) {
          .share-card-container {
            padding: 1rem;
            justify-content: flex-start;
            padding-top: 80px;
          }
          
          .back-home-btn {
            top: 16px;
            left: 16px;
            font-size: 0.9rem;
            padding: 8px 16px;
          }
          
          .share-card-wrapper {
            max-width: 100%;
          }
        }
      `}</style>

      <div className="share-card-container">
        <button onClick={() => navigate("/")} className="back-home-btn">
          ← Back to EatWhere
        </button>

        {loading && (
          <div className="share-card-wrapper">
            <div className="loading-spinner"></div>
            <p>Loading store...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <button onClick={() => navigate("/")} className="back-home-btn" style={{ position: 'static', marginTop: '1rem' }}>
              Back to Home
            </button>
          </div>
        )}

        {!loading && !error && store && (
          <div className="share-card-wrapper">
            <StoreCard 
              store={store} 
              onEdit={() => {}} 
              onDelete={() => {}}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ShareCard;