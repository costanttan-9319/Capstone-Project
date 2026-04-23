import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import CasinoIcon from "@mui/icons-material/Casino";
import api from "../services/api";
import useAuth from "../hooks/useAuth";
import StoreCard from "../components/StoreCard";
import EditStoreModal from "../components/EditStoreModal";
import { useTheme } from '@mui/material/styles';
import { colors } from '../theme';

// ==================== HOME PAGE ====================
const Home = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [isRolling, setIsRolling] = useState(false);
  const [randomStore, setRandomStore] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const username = user?.username || "";
  const theme = useTheme();

  // SURGERY: Removed Frontend Special Status (tempStatuses) and associated handlers
  // because status is now handled by the Backend Database.

  // ==================== ADMIN MODAL STATES ====================
  const [editingStore, setEditingStore] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditClick = (store) => {
    setEditingStore(store);
    setIsEditModalOpen(true);
  };

  const handleDeleteSuccess = (storeId) => {
    if (searchResults) {
      const updatedResults = {
        tier_1_within_1km: searchResults.tier_1_within_1km.filter(
          (s) => s.id !== storeId,
        ),
        tier_2_within_2km: searchResults.tier_2_within_2km.filter(
          (s) => s.id !== storeId,
        ),
        tier_3_beyond_2km: searchResults.tier_3_beyond_2km.filter(
          (s) => s.id !== storeId,
        ),
      };
      setSearchResults(updatedResults);
    }
    if (randomStore?.id === storeId) setRandomStore(null);
  };

  const CUISINES = [
    "All",
    "Chinese",
    "Local",
    "Muslim",
    "Halal",
    "Indian",
    "Western",
    "Fast Food",
    "Seafood",
    "Vegetarian",
    "Korean",
    "Japanese",
    "Vietnamese",
    "Mediterranean",
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCuisineDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchResults) {
      localStorage.setItem("savedSearchResults", JSON.stringify(searchResults));
      localStorage.setItem("savedLocation", location);
      localStorage.setItem("savedCuisine", cuisine);
    }
  }, [searchResults, location, cuisine]);

  useEffect(() => {
    const savedResults = localStorage.getItem("savedSearchResults");
    const savedLocation = localStorage.getItem("savedLocation");
    const savedCuisine = localStorage.getItem("savedCuisine");

    if (savedResults && savedLocation) {
      setSearchResults(JSON.parse(savedResults));
      setLocation(savedLocation);
      setCuisine(savedCuisine || "");
    }
  }, []);

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          localStorage.setItem("userLat", position.coords.latitude);
          localStorage.setItem("userLng", position.coords.longitude);
          setLocation("Current Location");
        },
        () =>
          alert(
            "Unable to get your location. Please enable location services.",
          ),
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const performSearch = async (searchLocation, searchCuisine) => {
    if (!searchLocation) {
      alert("Please enter a location or use My Location");
      return;
    }
    setLoading(true);
    try {
      const cuisineParam = searchCuisine === "All" ? "" : searchCuisine;
      const response = await api.get(`/stores/search-by-address`, {
        params: { address: searchLocation, cuisine: cuisineParam },
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error("Search error:", error);
      alert("Error fetching results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!location) {
      alert("Please enter a location or use My Location");
      return;
    }
    if (location === "Current Location") {
      const lat = localStorage.getItem("userLat");
      const lng = localStorage.getItem("userLng");
      if (lat && lng) performSearchByCoords(lat, lng, cuisine);
      else alert("Unable to get your location. Please try again.");
    } else {
      performSearch(location, cuisine);
    }
  };

  const performSearchByCoords = async (lat, lng, searchCuisine) => {
    setLoading(true);
    try {
      const cuisineParam = searchCuisine === "All" ? "" : searchCuisine;
      const response = await api.get(`/stores/search-by-coordinates`, {
        params: { lat, lng, cuisine: cuisineParam },
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error("Search error:", error);
      alert("Error fetching results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTryMe = async () => {
    if (!location) {
      alert("Please enter a location or use My Location");
      return;
    }
    setIsRolling(true);
    setRandomStore(null);
    try {
      let response;
      const cuisineParam = cuisine === "All" || !cuisine ? "" : cuisine;
      const params = { cuisine: cuisineParam, max_distance: 1.5 };

      if (location === "Current Location") {
        const lat = localStorage.getItem("userLat");
        const lng = localStorage.getItem("userLng");
        if (lat && lng) {
          response = await api.get(`/stores/roll-dice-by-coordinates`, {
            params: { ...params, lat, lng },
          });
        } else {
          alert("Unable to get your location.");
          setIsRolling(false);
          return;
        }
      } else {
        response = await api.get(`/stores/roll-dice`, {
          params: { ...params, address: location },
        });
      }
      const selectedStore = response.data.selected_store;
      setTimeout(() => {
        setRandomStore(selectedStore);
        setSearchResults(null);
        setIsRolling(false);
      }, 600);
    } catch (error) {
      console.error("Roll dice error:", error);
      alert(error.response?.data?.error || "No stores found within 1.5km");
      setIsRolling(false);
    }
  };

  const renderTierSection = (title, subtitle, stores, tierClass) => {
    if (!stores || !Array.isArray(stores) || stores.length === 0) return null;

    return (
      <div className={`tier-container ${tierClass}`}>
        <div className="tier-header-wrapper">
          <div className="tier-line"></div>
          <h2 className="tier-title">{title}</h2>
          <div className="tier-line"></div>
        </div>
        <h3 className="tier-subtitle">{subtitle}</h3>
        <div className="store-grid">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onEdit={handleEditClick}
              onDelete={handleDeleteSuccess}
              // SURGERY: Removed temporaryStatus/temporaryMessage props.
              // StoreCard will now use the data from the database.
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ color: theme.palette.primary.main }}>

      <div className="home-container">
        {username && <div className="welcome-user">Welcome, {username}!</div>}
        <div className="welcome-section">
          <h1 className="welcome-title">Exploration Starts Here!</h1>
        </div>

        <div className="search-box-pink">
          <div className="search-row">
            <div className="location-wrapper">
              <input
                type="text"
                className="location-input"
                placeholder="Type Your Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <button className="my-location-btn" onClick={handleMyLocation}>
                <MyLocationIcon />
              </button>
            </div>

            <div className="cuisine-wrapper" ref={dropdownRef}>
              <input
                type="text"
                className="cuisine-input"
                placeholder="Search Cuisines"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                onFocus={() => setShowCuisineDropdown(true)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              {showCuisineDropdown && (
                <div className="cuisine-dropdown">
                  {CUISINES.filter((c) =>
                    c.toLowerCase().includes(cuisine.toLowerCase()),
                  ).map((c) => (
                    <div
                      key={c}
                      className="cuisine-option"
                      onClick={() => {
                        setCuisine(c);
                        setShowCuisineDropdown(false);
                      }}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="search-btn" onClick={handleSearch}>
              Search
            </button>
            <button
              className={`tryme-btn ${isRolling ? "rolling" : ""}`}
              onClick={handleTryMe}
              disabled={isRolling}
            >
              <CasinoIcon className="tryme-icon" />
              <span className="tryme-text">TRY ME</span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Finding great eats near you...</p>
          </div>
        )}

        {searchResults && !loading && (
          <div className="results-container">
            {renderTierSection(
              "Easy Reach",
              "Within 1km",
              searchResults.tier_1_within_1km,
              "tier1",
            )}
            {renderTierSection(
              "Short Trips",
              "Within 2km",
              searchResults.tier_2_within_2km,
              "tier2",
            )}
            {renderTierSection(
              "Explorer",
              "Beyond 2km",
              searchResults.tier_3_beyond_2km,
              "tier3",
            )}
            {!searchResults.tier_1_within_1km?.length &&
              !searchResults.tier_2_within_2km?.length &&
              !searchResults.tier_3_beyond_2km?.length && (
                <div className="no-results">
                  <p>
                    No stores found in your area. Try a different location or
                    cuisine.
                  </p>
                </div>
              )}
          </div>
        )}

{randomStore && !searchResults && (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '480px',
    margin: '0 auto',
    padding: '2rem 1rem',
  }}>
    {/* Header */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      marginBottom: '2rem',
      width: '100%',
    }}>
      <div style={{
        flex: 1,
        height: '2px',
        background: '#d81473',
      }} />
      <span style={{
        fontSize: '2rem',
      }}>🎲</span>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#d81473',
        margin: 0,
      }}>Try Me picked:</h2>
      <div style={{
        flex: 1,
        height: '2px',
        background: '#d81473',
      }} />
    </div>

    {/* Spacer */}
    <div style={{ height: '2rem' }} />

    {/* Single Card Container */}
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    }}>
      <div style={{
        width: '380px',
        margin: '0 auto',
      }}>
        <StoreCard
          store={randomStore}
          onEdit={handleEditClick}
          onDelete={handleDeleteSuccess}
        />
      </div>
    </div>
  </div>
)}

        <EditStoreModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          store={editingStore}
          onSuccess={() => {
            setIsEditModalOpen(false);
            handleSearch();
            if (randomStore && randomStore.id === editingStore.id)
              setRandomStore(null);
            alert("Store updated successfully!");
          }}
        />
      </div>
    </div>
  );
};

export default Home;
