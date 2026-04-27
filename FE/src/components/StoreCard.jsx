import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import TurnSlightRightIcon from "@mui/icons-material/TurnSlightRight";
import useAuth from "../hooks/useAuth";
import useTime from "../hooks/useTime";
import api from "../services/api";
import LoginModal from "./LoginModal";
import ReviewModal from "./ReviewModal";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import "./StoreCard.css";

// ==================== STORE CARD COMPONENT ====================
const StoreCard = ({ store, onEdit, onDelete, onToggleTopPick }) => {
  console.log("🃏 StoreCard rendering for store:", store?.id, store?.name);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentDay, getStoreStatus, getDisplayDay } = useTime();
  const normalStatus = getStoreStatus(store.opening_hours);
  const displayDay = getDisplayDay(store.opening_hours);
  const [isFaved, setIsFaved] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isTogglingTopPick, setIsTogglingTopPick] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [localTopPick, setLocalTopPick] = useState(store.is_top_pick);

  // ==================== IMAGE CAROUSEL STATE ====================
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  console.log("📸 Store images:", store.images);
  console.log("⭐ Is Top Pick:", localTopPick);
  console.log("👤 User role:", user?.role);
  console.log("🖼️ Store image_path:", store.image_path);

  // Priority: Custom images first, then database image_path as single image
  const storeImages =
    store.images?.length > 0
      ? store.images
      : store.image_path
        ? [store.image_path]
        : [];
  const hasMultipleImages = storeImages.length > 1;

  console.log("🖼️ Store images array:", storeImages);
  console.log("🎠 Has multiple images:", hasMultipleImages);

  // Fallback placeholder image (DATA URI - guaranteed to work, no internet needed)
  const FALLBACK_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='14'%3E📷 No Image%3C/text%3E%3C/svg%3E";

  // Get current image URL with database fallback (custom images → database image_path → placeholder)
  const getCurrentImageUrl = () => {
    console.log("🔍 Getting current image, imgError:", imgError);
    console.log("📸 store.image_path:", store.image_path);
    console.log("🖼️ storeImages array:", storeImages);

    // If custom image failed to load, try database image_path as fallback
    if (imgError) {
      if (store.image_path) {
        console.log(
          "⚠️ Custom image failed, falling back to database image_path:",
          store.image_path,
        );
        // Reset error state for the fallback image
        setTimeout(() => setImgError(false), 100);
        return store.image_path;
      }
      console.log("⚠️ No database fallback, using placeholder");
      return FALLBACK_IMAGE;
    }

    // First priority: Custom images from store.images (carousel)
    if (storeImages.length > 0 && storeImages[currentImageIndex]) {
      console.log("✅ Using custom image:", storeImages[currentImageIndex]);
      return storeImages[currentImageIndex];
    }

    // Second priority: Database image_path (single Google image from seeding)
    if (store.image_path) {
      console.log("✅ Using database image_path:", store.image_path);
      return store.image_path;
    }

    // Last resort: No image placeholder
    console.log("⚠️ No images at all, using fallback");
    return FALLBACK_IMAGE;
  };

  // Handle image load error
  const handleImageError = () => {
    console.log("❌ Image failed to load for index:", currentImageIndex);
    setImgError(true);
  };

  // Reset image error when index changes
  useEffect(() => {
    console.log(
      "🔄 Image index changed to:",
      currentImageIndex,
      "- resetting error state",
    );
    setImgError(false);
  }, [currentImageIndex, store.id]);

  // Sync localTopPick when store prop changes
  useEffect(() => {
    setLocalTopPick(store.is_top_pick);
  }, [store.is_top_pick]);

  // ==================== CAROUSEL NAVIGATION ====================
  const nextImage = (e) => {
    console.log("➡️ Next image button clicked");
    e.stopPropagation();
    if (storeImages.length > 0) {
      const newIndex = (currentImageIndex + 1) % storeImages.length;
      console.log("Moving from index", currentImageIndex, "to", newIndex);
      setCurrentImageIndex(newIndex);
    }
  };

  const prevImage = (e) => {
    console.log("⬅️ Previous image button clicked");
    e.stopPropagation();
    if (storeImages.length > 0) {
      const newIndex =
        (currentImageIndex - 1 + storeImages.length) % storeImages.length;
      console.log("Moving from index", currentImageIndex, "to", newIndex);
      setCurrentImageIndex(newIndex);
    }
  };

  // Reset index when store changes
  useEffect(() => {
    console.log("🔄 Store changed, resetting image index to 0");
    setCurrentImageIndex(0);
  }, [store.id]);

  // ==================== READ SPECIAL STATUS FROM DATABASE ====================
  const specialStatus = store.special_status;
  const specialMessage = store.special_message;
  console.log("🏷️ Special status:", specialStatus);

  // ==================== SOCIAL MEDIA LINKS ====================
  const facebookUrl = store.social_media?.facebook || null;
  const instagramUrl = store.social_media?.instagram || null;
  console.log("📱 Facebook:", facebookUrl);
  console.log("📱 Instagram:", instagramUrl);

  // ==================== SMART STATUS LOGIC ====================
  const getDisplayDetails = () => {
    console.log(
      "🎨 Getting display details for status:",
      specialStatus,
      "normalStatus:",
      normalStatus,
    );

    // 1. DATABASE OVERRIDES
    if (specialStatus === "Temporarily Closed") {
      console.log("🔴 Status: Temporarily Closed");
      return { text: "Temporarily\nClosed", color: "closed" };
    }
    if (specialStatus === "Closed Early") {
      console.log("🔴 Status: Closed Early");
      return { text: "Closed\nEarly", color: "closed" };
    }

    // 2. TIME GATEKEEPER
    if (normalStatus === "Closed") {
      console.log("🔴 Status: Closed (from time)");
      return { text: "Closed", color: "closed" };
    }

    // 3. THE DYE LAYER
    if (specialStatus === "Selling Out Soon") {
      console.log("🟠 Status: Selling Out Soon");
      return { text: "Selling\nOut Soon", color: "orange" };
    }
    if (specialStatus === "Drinks & Bites") {
      console.log("🟣 Status: Drinks & Bites");
      return { text: "Drinks &\nBites", color: "purple" };
    }

    // 4. DEFAULT
    const color = normalStatus === "Closing Soon" ? "closing-soon" : "open";
    console.log("🟢 Default status:", normalStatus, "color:", color);
    return { text: normalStatus, color: color };
  };

  const { text: displayText, color: pillColor } = getDisplayDetails();

  // ==================== PERMISSIONS ====================
  // ==================== PERMISSIONS ====================
  const isAdmin = user?.role === "admin";
  const isPrimaryOwner = user && Number(store.owner_id) === Number(user.id);
  const isCoOwner = store.is_co_owner === true;
  const isOwner = isPrimaryOwner || isCoOwner;

  console.log("👑 Is Admin:", isAdmin);
  console.log("🔑 Is Primary Owner:", isPrimaryOwner);
  console.log("👥 Is Co-owner:", isCoOwner);
  console.log("✅ Is Owner (can edit):", isOwner);

  // ==================== TRUNCATE NAME ====================
  const displayName =
    store.name.length > 18 ? store.name.substring(0, 18) + "..." : store.name;

  // ==================== SHARE FUNCTION ====================
  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/store/${store.id}`;
    navigator.clipboard.writeText(url);
    alert("Link copied! Share with friends!");
  };

  // ==================== ADMIN DELETE LOGIC ====================
  const handleDelete = async (e) => {
    console.log("🗑️ Delete button clicked for store:", store.id);
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to PERMANENTLY delete "${store.name}"? This cannot be undone.`,
    );

    if (confirmed) {
      console.log("✅ Delete confirmed");
      try {
        console.log("📡 Sending DELETE request to /stores/${store.id}");
        await api.delete(`/stores/${store.id}`);
        console.log("✅ Store deleted successfully");
        onDelete(store.id);
      } catch (error) {
        console.error("❌ Delete error:", error);
        alert("Failed to delete store.");
      }
    } else {
      console.log("❌ Delete cancelled");
    }
  };

  // ==================== TOGGLE TOP PICK (FIXED - NO PAGE RELOAD) ====================
  const handleToggleTopPick = async (e) => {
    console.log("⭐ Top Pick button clicked for store:", store.id);
    console.log("Current Top Pick status:", localTopPick);
    e.stopPropagation();

    if (!isAdmin) {
      console.log("🚫 User is not admin, cannot toggle Top Pick");
      return;
    }

    // OPTIMISTIC UPDATE - Update UI immediately
    const newTopPickStatus = !localTopPick;
    console.log("🔄 New Top Pick status will be:", newTopPickStatus);

    // Update local state immediately (UI updates instantly)
    setLocalTopPick(newTopPickStatus);

    setIsTogglingTopPick(true);

    try {
      console.log(
        "📡 Sending PUT request to /stores/${store.id}/top-pick with:",
        { is_top_pick: newTopPickStatus },
      );

      const response = await api.put(`/stores/${store.id}/top-pick`, {
        is_top_pick: newTopPickStatus,
      });
      console.log("✅ API response:", response.data);

      // Notify parent component if callback exists
      if (onToggleTopPick) {
        onToggleTopPick(store.id, newTopPickStatus);
      }
    } catch (error) {
      console.error("❌ Toggle Top Pick error:", error);
      console.error("Error response:", error.response);

      // Revert on error
      setLocalTopPick(!newTopPickStatus);
      alert("Failed to update Top Pick status");
    } finally {
      setIsTogglingTopPick(false);
    }
  };

  // ==================== CHECK IF STORE IS FAVOURITED ====================
  useEffect(() => {
    if (!user) {
      console.log("👤 No user logged in, skipping favourite check");
      return;
    }

    const checkFavourite = async () => {
      console.log("🔍 Checking if store is favourited:", store.id);
      try {
        const response = await api.get(`/stores/${store.id}/favourite/check`);
        console.log("✅ Favourite check response:", response.data);
        setIsFaved(response.data.isFavourited);
      } catch (error) {
        console.error("❌ Error checking favourite:", error);
      }
    };
    checkFavourite();
  }, [user, store.id]);

  // ==================== MEMBER-ONLY GUARD ====================
  const handleMemberAction = (e, action) => {
    console.log("🔒 Member action triggered");
    e.stopPropagation();
    if (!user) {
      console.log("🚫 No user, showing login modal");
      setShowLoginModal(true);
      return;
    }
    console.log("✅ User logged in, executing action");
    action();
  };

  // ==================== ADD LIKE (DOUBLE CLICK ONLY) ====================
  const addLike = async () => {
    console.log("❤️ Add like triggered");
    if (!isFaved) {
      try {
        console.log("📡 Sending POST to /stores/${store.id}/favourite");
        await api.post(`/stores/${store.id}/favourite`);
        console.log("✅ Added to favourites");
        setIsFaved(true);
      } catch (error) {
        console.error("❌ Error adding to favourites:", error);
      }
    } else {
      console.log("ℹ️ Already favourited, skipping");
    }
  };

  // ==================== TOGGLE LIKE (HEART BUTTON ONLY) ====================
  const toggleLike = async () => {
    console.log("💖 Toggle like triggered, current isFaved:", isFaved);
    if (isFaved) {
      try {
        console.log("📡 Sending DELETE to /stores/${store.id}/favourite");
        await api.delete(`/stores/${store.id}/favourite`);
        console.log("✅ Removed from favourites");
        setIsFaved(false);
      } catch (error) {
        console.error("❌ Error removing from favourites:", error);
      }
    } else {
      try {
        console.log("📡 Sending POST to /stores/${store.id}/favourite");
        await api.post(`/stores/${store.id}/favourite`);
        console.log("✅ Added to favourites");
        setIsFaved(true);
      } catch (error) {
        console.error("❌ Error adding to favourites:", error);
      }
    }
  };

  // ==================== RENDER CUISINES ====================
  const renderCuisines = (cuisine) => {
    if (!cuisine) return <span className="store-card-cuisine">Various</span>;

    let cuisinesArray = [];
    if (Array.isArray(cuisine)) {
      cuisinesArray = cuisine;
    } else if (typeof cuisine === "string") {
      cuisinesArray = cuisine.split(",").map((c) => c.trim());
    }
    console.log("🍽️ Rendering cuisines:", cuisinesArray);

    return cuisinesArray.map((c, index) => (
      <span key={index} className="store-card-cuisine">
        {c}
      </span>
    ));
  };

 // ==================== RENDER ====================
console.log("🎨 Rendering StoreCard UI");

return (
  <>
    <div
      className={`store-card ${localTopPick ? "top-pick-card" : ""}`}
      onDoubleClick={(e) => handleMemberAction(e, addLike)}
    >
      {/* IMAGE HEADER WITH CAROUSEL */}
      <div 
        className="card-image-container" 
        style={{ position: "relative" }}
        onDoubleClick={(e) => e.stopPropagation()}  // ← THIS LINE ADDED
      >
        <img
          src={getCurrentImageUrl()}
          alt={store.name}
          className="store-card-image"
          onError={handleImageError}
          referrerPolicy="no-referrer"
        />

        {/* Carousel Navigation Arrows */}
        {hasMultipleImages && !imgError && (
          <>
            <button
              className="carousel-arrow left"
              onClick={prevImage}
              style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
                zIndex: 10,
                backdropFilter: "blur(4px)",
              }}
            >
              <ChevronLeftIcon />
            </button>
            <button
              className="carousel-arrow right"
              onClick={nextImage}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
                zIndex: 10,
                backdropFilter: "blur(4px)",
              }}
            >
              <ChevronRightIcon />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {hasMultipleImages && !imgError && (
          <div
            className="carousel-dots"
            style={{
              position: "absolute",
              bottom: "8px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "6px",
              zIndex: 10,
              backgroundColor: "rgba(0,0,0,0.4)",
              padding: "4px 8px",
              borderRadius: "12px",
              backdropFilter: "blur(4px)",
            }}
          >
            {storeImages.map((_, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("🎯 Dot clicked, index:", idx);
                  setCurrentImageIndex(idx);
                }}
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor:
                    idx === currentImageIndex
                      ? "#d81473"
                      : "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        )}

        {/* ADMIN BUTTONS */}
        {(isAdmin || isOwner) && (
          <button
            className="admin-btn edit"
            onClick={(e) => {
              e.stopPropagation();
              console.log("✏️ Edit button clicked for store:", store.id);
              if (onEdit) {
                onEdit(store);
              } else {
                console.error("❌ onEdit prop is missing");
              }
            }}
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              backgroundColor: "#007bff",
              border: "2px solid white",
              borderRadius: "50%",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <EditIcon style={{ fontSize: "22px", color: "white" }} />
          </button>
        )}

        {/* TOP PICK BUTTON (Admin only) - NOW USES localTopPick */}
        {isAdmin && (
          <button
            className="admin-btn top-pick"
            onClick={handleToggleTopPick}
            disabled={isTogglingTopPick}
            style={{
              position: "absolute",
              top: "8px",
              left: "58px",
              backgroundColor: localTopPick ? "#ffbe1b" : "#6c757d",
              border: "2px solid white",
              borderRadius: "50%",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {localTopPick ? (
              <StarIcon style={{ fontSize: "22px", color: "white" }} />
            ) : (
              <StarBorderIcon style={{ fontSize: "22px", color: "white" }} />
            )}
          </button>
        )}

        {isAdmin && (
          <button
            className="admin-btn delete"
            onClick={handleDelete}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              backgroundColor: "#dc3545",
              border: "2px solid white",
              borderRadius: "50%",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <DeleteIcon style={{ fontSize: "22px", color: "white" }} />
          </button>
        )}
      </div>

        <div className="store-card-content">
          {/* IDENTITY ROW */}
          <div className="store-header-row" style={{ gap: "8px" }}>
            <div className="store-name-col">
              <h3 className="store-card-name" style={{ fontSize: "1.1rem" }}>
                {displayName}
                {localTopPick && (
                  <span style={{ marginLeft: "8px", fontSize: "14px" }}>
                    ⭐
                  </span>
                )}
              </h3>
              <div className="cuisine-wrapper">
                {renderCuisines(store.cuisine)}
              </div>
              <p className="store-card-distance">{store.distance_km}km away</p>
            </div>

            <div className="status-container">
              <div className={`status-pill ${pillColor}`} />
              <div
                className="status-text"
                style={{
                  whiteSpace: "pre-line",
                  textAlign: "center",
                  lineHeight: "1.1",
                  fontSize: "11px",
                }}
              >
                {displayText.split("\n").map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          </div>

          {/* RATING & REVIEW ROW */}
          <div className="rating-review-row" style={{ flexWrap: "wrap" }}>
            <div className="stars-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="star-icon">
                  {star <= Math.round(store.rating || 0) ? "★" : "☆"}
                </span>
              ))}
              <span className="price-bracket">
                ({store.price_range || "$10-20"})
              </span>
            </div>
            <p className="community-text" style={{ fontSize: "10px" }}>
              (Reviews by Community)
            </p>
            <button
              className="review-btn"
              onClick={(e) =>
                handleMemberAction(e, () => setShowReviewModal(true))
              }
              style={{ fontSize: "12px", padding: "6px 10px" }}
            >
              Review
            </button>
          </div>

          {/* SOCIAL & HEART ROW */}
          <div className="social-heart-row">
            <div
              className="heart-toggle"
              onClick={(e) => handleMemberAction(e, toggleLike)}
            >
              {isFaved ? (
                <FavoriteIcon className="heart-icon active" />
              ) : (
                <FavoriteBorderIcon className="heart-icon" />
              )}
            </div>
            <div className="social-icons">
              {facebookUrl ? (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <FacebookIcon
                    className="icon-fb"
                    style={{ color: "#1877f2" }}
                  />
                </a>
              ) : (
                <FacebookIcon
                  className="icon-fb"
                  style={{ opacity: 0.5, cursor: "not-allowed" }}
                />
              )}

              {instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <InstagramIcon
                    className="icon-ig"
                    style={{ color: "#e4405f" }}
                  />
                </a>
              ) : (
                <InstagramIcon
                  className="icon-ig"
                  style={{ opacity: 0.5, cursor: "not-allowed" }}
                />
              )}

              <div className="icon-xhs" style={{ fontSize: "10px" }}>
                小红书
              </div>
            </div>
          </div>

          {/* DESCRIPTION BOX WITH SHARE BUTTON ON SAME ROW */}
          <div className="description-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <h4 className="section-label" style={{ marginBottom: 0 }}>
                Description
              </h4>
              <div
                className="share-btn"
                onClick={handleShare}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "#d81473",
                  padding: "8px",
                  minHeight: "44px",
                  minWidth: "44px",
                  borderRadius: "8px",
                }}
              >
                <TurnSlightRightIcon style={{ fontSize: "20px" }} />
                <span style={{ fontSize: "12px" }}>Share</span>
              </div>
            </div>
            <div className="description-text" style={{ fontSize: "13px" }}>
              {(() => {
                if (!store.description) return "No description provided.";
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const parts = store.description.split(urlRegex);
                return parts.map((part, index) => {
                  if (part.match(urlRegex)) {
                    return (
                      <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#d81473",
                          textDecoration: "underline",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {part}
                      </a>
                    );
                  }
                  return part;
                });
              })()}
            </div>
          </div>

          {/* OPENING HOURS */}
          <div className="hours-section">
            <h4 className="section-label">Opening hours</h4>
            <div className="hours-list">
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => {
                const hoursData = (store.opening_hours || {})[day];
                const isToday = day === displayDay;
                let displayTime = "Closed";

                if (hoursData && typeof hoursData === "object") {
                  if (hoursData.isClosed) displayTime = "Closed";
                  else if (hoursData.is24Hours) displayTime = "24 hours";
                  else if (hoursData.open && hoursData.close)
                    displayTime = `${hoursData.open} - ${hoursData.close}`;
                } else if (typeof hoursData === "string") {
                  displayTime = hoursData;
                }

                return (
                  <div
                    key={day}
                    className={`hours-row ${isToday ? "is-today" : ""}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                      fontSize: "12px",
                    }}
                  >
                    <span className="day-name">{day}</span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {hoursData?.message && (
                        <span
                          style={{
                            backgroundColor: "#eeeeee",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            maxWidth: "80px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {hoursData.message}
                        </span>
                      )}
                      <span
                        className="day-time"
                        style={{
                          color:
                            displayTime === "Closed" ? "#d32f2f" : "inherit",
                        }}
                      >
                        {displayTime}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {store.map_link && (
            <div className="google-maps-section">
              <a
                href={store.map_link}
                target="_blank"
                rel="noopener noreferrer"
                className="google-maps-btn"
                style={{ fontSize: "13px", padding: "10px" }}
                onClick={(e) => e.stopPropagation()}
              >
                Open in Google Maps
              </a>
            </div>
          )}
        </div>
      </div>

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        storeId={store.id}
        onSuccess={() => console.log("✅ Review modal success")}
      />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
      />
    </>
  );
};

export default StoreCard;
