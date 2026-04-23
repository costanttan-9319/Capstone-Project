import { Store } from "../models/storeModel.js";
import axios from "axios";
import { seedFromOpenStreetMap } from "../scripts/seedStores.js";
import { getAreaCoordinates } from "../config/constants.js"; // Import the helper
import { StoreImage } from "../models/storeImageModel.js"; // Import Images
import { Favourite } from "../models/favouritepageModel.js";
import dotenv from "dotenv";
import db from "../config/db.js";

// ===================Helper function to calculate distance between two coordinates==================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// =================Helper function to get distance tier=================
function getDistanceTier(distanceKm) {
  if (distanceKm <= 1) return 1; // Tier 1: within 1km
  if (distanceKm <= 2) return 2; // Tier 2: within 2km
  return 3; // Tier 3: more than 2km
}

export const StoreController = {
  // FOR SEEDING DATA VIA THUNDER CLIENT
  async seed(req, res) {
    try {
      console.log("🚀 Seeding started via API...");
      await seedFromOpenStreetMap();
      res.status(200).json({ message: "Seeding completed successfully!" });
    } catch (err) {
      res.status(500).json({ error: "Seeding failed", details: err.message });
    }
  },
// =================FOR CREATING A STORE=================
  async createStore(req, res) {
    try {
      const {
        name,
        country,
        area,
        lat,
        lng,
        cuisine,
        rating,
        description,
        opening_hours,
        image_path,
        map_link,
        price_range,
        operating,
        owner_id,
        social_media,
        article_links,
      } = req.body;

      const stringifiedOpeningHours =
        opening_hours && typeof opening_hours === "object"
          ? JSON.stringify(opening_hours)
          : opening_hours;

      const storeId = await Store.create({
        name,
        country: country || "Singapore",
        area,
        cuisine,
        lat,
        lng,
        rating,
        description,
        image_path,
        map_link,
        opening_hours: stringifiedOpeningHours,
        price_range,
        operating,
        owner_id,
        social_media,
        article_links,
      });

      res.status(201).json({ message: "Store created successfully", storeId });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Failed to create store", details: err.message });
    }
  },

  // =================DEFAULT SEARCH - picks area's default coordinates automatically=================
  async getAllStores(req, res) {
    try {
      const { area, cuisine } = req.query;

      // Validate required fields (Country and Area)
      if (!area) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "Please fill in Country and Area",
        });
      }

      let stores = await Store.findAll();

      // FILTER BY AREA
      if (area) {
        stores = stores.filter((s) => s.area === area);
      }

      

      // =================FILTER BY CUISINE (supports both string and JSON array)=================
      if (cuisine) {
        stores = stores.filter((s) => {
          if (!s.cuisine) return false;

          let storeCuisines;
          if (Array.isArray(s.cuisine)) {
            storeCuisines = s.cuisine;
          } else if (typeof s.cuisine === "string") {
            storeCuisines = s.cuisine.split(", ");
          } else {
            return false;
          }

          return storeCuisines.includes(cuisine);
        });
      }

dotenv.config();

 // =================AUTOMATICALLY USE AREA'S DEFAULT COORDINATES for distance calculation=================
      const areaCoords = getAreaCoordinates(area);

      // =================Calculate distance from area center to each store=================
      const storesWithDistance = stores.map((store) => {
        if (store.lat && store.lng) {
          const distance = calculateDistance(
            areaCoords.lat,
            areaCoords.lng,
            store.lat,
            store.lng,
          );
          const tier = getDistanceTier(distance);
          return {
            ...store,
            search_center: areaCoords,
            distance_from_center_km: parseFloat(distance.toFixed(2)),
            tier: tier,
          };
        }
        return {
          ...store,
          search_center: areaCoords,
          distance_from_center_km: null,
          tier: null,
        };
      });

      // ===================================================Group by tier==================================
      const tier1Stores = storesWithDistance.filter((s) => s.tier === 1);
      const tier2Stores = storesWithDistance.filter((s) => s.tier === 2);
      const tier3Stores = storesWithDistance.filter((s) => s.tier === 3);
      const noLocationStores = storesWithDistance.filter(
        (s) => s.tier === null,
      );
   // ==================================Sort each tier by distance==================================
      tier1Stores.sort(
        (a, b) => a.distance_from_center_km - b.distance_from_center_km,
      );
      tier2Stores.sort(
        (a, b) => a.distance_from_center_km - b.distance_from_center_km,
      );
      tier3Stores.sort(
        (a, b) => a.distance_from_center_km - b.distance_from_center_km,
      );

      res.json({
        search_area: area,
        search_center: areaCoords,
        cuisine_filter: cuisine || "All",
        tier_1_within_1km: tier1Stores,
        tier_2_within_2km: tier2Stores,
        tier_3_beyond_2km: tier3Stores,
        stores_without_location: noLocationStores,
        summary: {
          total: stores.length,
          within_1km: tier1Stores.length,
          within_2km: tier2Stores.length,
          beyond_2km: tier3Stores.length,
          no_location: noLocationStores.length,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

//==================================MY LOCATION SEARCH - user provides their own GPS coordinates==================================
  async getStoresByMyLocation(req, res) {
    try {
      const { lat, lng, area, cuisine } = req.query;

      // Validate location
      if (!lat || !lng) {
        return res.status(400).json({
          error: "Please provide your location",
          message: "My location search requires latitude and longitude",
        });
      }

      let stores = await Store.findAll();

      // FILTER BY AREA (optional)
      if (area) {
        stores = stores.filter((s) => s.area === area);
      }

      // FILTER BY CUISINE
      if (cuisine) {
        stores = stores.filter((s) => {
          if (!s.cuisine) return false;

          let storeCuisines;
          if (Array.isArray(s.cuisine)) {
            storeCuisines = s.cuisine;
          } else if (typeof s.cuisine === "string") {
            storeCuisines = s.cuisine.split(", ");
          } else {
            return false;
          }

          return storeCuisines.includes(cuisine);
        });
      }

      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      const tier1Stores = [];
      const tier2Stores = [];
      const tier3Stores = [];

      stores.forEach((store) => {
        if (store.lat && store.lng) {
          const distance = calculateDistance(
            userLat,
            userLng,
            store.lat,
            store.lng,
          );
          const storeWithDistance = {
            ...store,
            distance_from_user_km: parseFloat(distance.toFixed(2)),
          };

          if (distance <= 1) {
            tier1Stores.push(storeWithDistance);
          } else if (distance <= 2) {
            tier2Stores.push(storeWithDistance);
          } else if (distance <= 2.5) {
            tier3Stores.push(storeWithDistance);
          }
        }
      });

//================================== Sort each tier by distance==================================
      tier1Stores.sort(
        (a, b) => a.distance_from_user_km - b.distance_from_user_km,
      );
      tier2Stores.sort(
        (a, b) => a.distance_from_user_km - b.distance_from_user_km,
      );
      tier3Stores.sort(
        (a, b) => a.distance_from_user_km - b.distance_from_user_km,
      );

      res.json({
        user_location: { lat: userLat, lng: userLng },
        search_filters: { area: area || "All", cuisine: cuisine || "All" },
        tier_1_within_1km: tier1Stores,
        tier_2_within_2km: tier2Stores,
        tier_3_beyond_2km: tier3Stores,
        summary: {
          total_found: stores.length,
          within_1km: tier1Stores.length,
          within_2km: tier2Stores.length,
          beyond_2km: tier3Stores.length,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // =================ROLL DICE - Random store picker using area's default coordinates=================
  async rollDice(req, res) {
    try {
      const { area, cuisine } = req.query;

      // Validate required fields
      if (!area) {
        return res.status(400).json({
          error: "Missing required fields",
          message: "Please fill in Country and Area before rolling the dice!",
        });
      }

      let stores = await Store.findAll();

      //=================================================== Filter by area===================================================
      stores = stores.filter((s) => s.area === area);

      // Filter by cuisine (if provided)
      if (cuisine) {
        stores = stores.filter((s) => {
          if (!s.cuisine) return false;

          let storeCuisines;
          if (Array.isArray(s.cuisine)) {
            storeCuisines = s.cuisine;
          } else if (typeof s.cuisine === "string") {
            storeCuisines = s.cuisine.split(", ");
          } else {
            return false;
          }

          return storeCuisines.includes(cuisine);
        });
      }

      if (stores.length === 0) {
        return res.status(404).json({
          error: "No stores found",
          message: `No ${cuisine ? cuisine + " " : ""}restaurants found in ${area}. Try a different area or cuisine!`,
        });
      }

 // ===================================================Random selection===================================================
      const randomIndex = Math.floor(Math.random() * stores.length);
      let selectedStore = stores[randomIndex];

      // ===================================================Add distance from area center===================================================
      const areaCoords = getAreaCoordinates(area);
      if (selectedStore.lat && selectedStore.lng) {
        const distance = calculateDistance(
          areaCoords.lat,
          areaCoords.lng,
          selectedStore.lat,
          selectedStore.lng,
        );
        const tier = getDistanceTier(distance);
        selectedStore = {
          ...selectedStore,
          distance_from_center_km: parseFloat(distance.toFixed(2)),
          tier: tier,
        };
      }

      res.json({
        message: "🎲 The dice has spoken!",
        search_area: area,
        cuisine_filter: cuisine || "All",
        total_options: stores.length,
        selected_store: selectedStore,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ===================================================FOR FETCHING ONE STORE===================================================
  async getStore(req, res) {
    try {
      const store = await Store.findById(req.params.id);
      if (!store) return res.status(404).json({ error: "Store not found" });
      res.json(store);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },


// ===================================================FOR UPDATING A STORE===================================================
async updateStore(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // 🔴 SURGERY: Permission Check - Get the store first
    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }
    
    // Check permissions: Admin OR Primary Owner OR Co-owner
    const isAdmin = userRole === 'admin';
    const isPrimaryOwner = Number(store.owner_id) === Number(userId);
    
    // Check co-owner in store_owners table
    const [coOwnerCheck] = await db.execute(
      "SELECT id FROM store_owners WHERE user_id = ? AND store_id = ? AND is_approved = TRUE",
      [userId, id]
    );
    const isCoOwner = coOwnerCheck.length > 0;
    
    // 🔴🔴🔴 DEBUG LOGS
    console.log("🔴🔴🔴 Debug - userId:", userId);
    console.log("🔴🔴🔴 Debug - store.owner_id:", store.owner_id);
    console.log("🔴🔴🔴 Debug - isPrimaryOwner:", isPrimaryOwner);
    console.log("🔴🔴🔴 Debug - coOwnerCheck result:", coOwnerCheck);
    console.log("🔴🔴🔴 Debug - isCoOwner:", isCoOwner);
    
    if (!isAdmin && !isPrimaryOwner && !isCoOwner) {
      console.log(`🔴 Unauthorized update attempt by user ${userId} on store ${id}`);
      return res.status(403).json({ error: "Unauthorized: You do not own this store" });
    }
    
    console.log(`🟢 Authorized update by user ${userId} (Admin: ${isAdmin}, Primary: ${isPrimaryOwner}, Co-owner: ${isCoOwner}) on store ${id}`);
    
    const updateData = {};

    // 1. Only grab what is actually in the request
    const fields = [
      "name",
      "country",
      "area",
      "lat",
      "lng",
      "rating",
      "image_path",
      "map_link",
      "operating",
      "description",
      "price_range",
      "special_status",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // 2. Handle JSON strings for Cuisine, Opening Hours, Images, and Social Media
    if (req.body.cuisine !== undefined) {
      const cuisineData = Array.isArray(req.body.cuisine) 
        ? req.body.cuisine 
        : [req.body.cuisine];
      updateData.cuisine = JSON.stringify(cuisineData);
    }

    if (req.body.opening_hours !== undefined) {
      updateData.opening_hours = typeof req.body.opening_hours === "object"
        ? JSON.stringify(req.body.opening_hours)
        : req.body.opening_hours;
    }
    
    // NEW: Handle Images array
    if (req.body.images !== undefined) {
      updateData.images = Array.isArray(req.body.images)
        ? JSON.stringify(req.body.images)
        : req.body.images;
    }
    
    // Handle Social Media
    if (req.body.social_media !== undefined) {
      updateData.social_media = typeof req.body.social_media === "object"
        ? JSON.stringify(req.body.social_media)
        : req.body.social_media;
    }

    // 3. Final check: Don't run an empty query
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No data provided to update" });
    }

    const updated = await Store.update(id, updateData);

    if (!updated) return res.status(404).json({ error: "Store not found" });
    res.json({ message: "Store updated successfully" });
  } catch (err) {
    console.error("❌ Update Error:", err.message);
    res
      .status(500)
      .json({ error: "Failed to update store", details: err.message });
  }
},

  // ===================================== REQUEST STORE OWNERSHIP =====================================
  async requestOwnership(req, res) {
    try {
      const { store_name, store_address, proof_documents } = req.body;
      const user_id = req.user.id;

      console.log("User ID from token:", user_id); // DEBUG
      console.log("Request body:", req.body); // DEBUG

      if (!store_name || !store_address || !proof_documents) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const { StoreOwner } = await import("../models/storeOwnerModel.js");
      const requestId = await StoreOwner.createRequest({
        user_id,
        store_name,
        store_address,
        proof_documents,
      });

      res.status(201).json({
        message: "Ownership request submitted successfully",
        requestId,
      });
    } catch (err) {
      console.error("Request ownership error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== ADD STORE IMAGE ====================
  async addStoreImage(req, res) {
    try {
      const { storeId, imageUrl } = req.body;
      const userId = req.user.id;

      const [ownerCheck] = await db.execute(
        "SELECT id FROM store_owners WHERE user_id = ? AND store_id = ? AND is_approved = TRUE",
        [userId, storeId],
      );

      if (ownerCheck.length === 0) {
        return res.status(403).json({ error: "You do not own this store" });
      }

      const currentCount = await StoreImage.countImages(storeId);

      if (currentCount >= 5) {
        return res.status(400).json({ error: "Maximum 5 images per store" });
      }

      const imageId = await StoreImage.addImage(
        storeId,
        imageUrl,
        currentCount,
      );
      res.status(201).json({ message: "Image added successfully", imageId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

 // ==================== GET STORE IMAGES ====================
  async getStoreImages(req, res) {
    try {
      const { storeId } = req.params;
      const images = await StoreImage.getByStoreId(storeId);
      res.json(images);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== DELETE STORE IMAGE ====================
  async deleteStoreImage(req, res) {
    try {
      const { imageId, storeId } = req.params;
      const userId = req.user.id;

      const [ownerCheck] = await db.execute(
        "SELECT id FROM store_owners WHERE user_id = ? AND store_id = ? AND is_approved = TRUE",
        [userId, storeId],
      );

      if (ownerCheck.length === 0) {
        return res.status(403).json({ error: "You do not own this store" });
      }

      const deleted = await StoreImage.deleteImage(imageId, storeId);
      if (!deleted) return res.status(404).json({ error: "Image not found" });

      res.json({ message: "Image deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ===================================== TOP PICKS (10 MUST EAT - RANDOM ORDER) =====================================
  async getTopPicks(req, res) {
    try {
      const { area } = req.query;

      let query = `
      SELECT * FROM stores 
      WHERE is_top_pick = TRUE 
      ORDER BY RAND()
      LIMIT 10
    `;

      let params = [];

      if (area) {
        query = `
        SELECT * FROM stores 
        WHERE area = ? AND is_top_pick = TRUE 
        ORDER BY RAND()
        LIMIT 10
      `;
        params = [area];
      }

      const [stores] = await db.execute(query, params);

      res.json(stores);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ===================================== TOGGLE TOP PICK (ADMIN ONLY) =====================================
async toggleTopPick(req, res) {
  try {
    const { id } = req.params;
    const { is_top_pick } = req.body;

    // Validate input
    if (is_top_pick === undefined) {
      return res.status(400).json({ error: "is_top_pick value is required" });
    }

    // Update the store's top pick status
    const updated = await Store.update(id, { is_top_pick: is_top_pick });

    if (!updated) {
      return res.status(404).json({ error: "Store not found" });
    }

    res.json({ 
      message: is_top_pick ? "Store added to Top Picks! ⭐" : "Store removed from Top Picks",
      is_top_pick: is_top_pick
    });
  } catch (err) {
    console.error("Toggle Top Pick error:", err);
    res.status(500).json({ error: err.message });
  }
},

  // ===================================== SEARCH BY ADDRESS =====================================
  async searchByAddress(req, res) {
    try {
      const { address, cuisine } = req.query;

      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

 // ==================================Geocode address to lat/lng using Nominatim==================================
      const geoResponse = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: `${address}, Singapore`,
            format: "json",
            limit: 1,
            countrycodes: "sg",
          },
          headers: { "User-Agent": "EatWhereApp/1.0" },
        },
      );

      if (!geoResponse.data || geoResponse.data.length === 0) {
        return res.status(404).json({ error: "Address not found" });
      }

      const lat = parseFloat(geoResponse.data[0].lat);
      const lng = parseFloat(geoResponse.data[0].lon);

      let stores = await Store.findAll();

      if (cuisine && cuisine !== "All") {
        const searchCuisineLower = cuisine.toLowerCase();
        stores = stores.filter((s) => {
          if (!s.cuisine) return false;
          let storeCuisines;
          if (Array.isArray(s.cuisine)) {
            storeCuisines = s.cuisine;
          } else if (typeof s.cuisine === "string") {
            storeCuisines = s.cuisine.split(", ");
          } else {
            return false;
          }
          // Convert each cuisine to lowercase for comparison
          return storeCuisines.some(
            (c) => c.toLowerCase() === searchCuisineLower,
          );
        });
      }

      const tier1 = [];
      const tier2 = [];
      const tier3 = [];

      stores.forEach((store) => {
        if (store.lat && store.lng) {
          const distance = calculateDistance(
            lat,
            lng,
            parseFloat(store.lat),
            parseFloat(store.lng),
          );
          const storeWithDistance = {
            ...store,
            distance_km: parseFloat(distance.toFixed(2)),
          };

          if (distance <= 1) tier1.push(storeWithDistance);
          else if (distance <= 2) tier2.push(storeWithDistance);
          else tier3.push(storeWithDistance);
        }
      });

      tier1.sort((a, b) => a.distance_km - b.distance_km);
      tier2.sort((a, b) => a.distance_km - b.distance_km);
      tier3.sort((a, b) => a.distance_km - b.distance_km);

      res.json({
        searched_address: address,
        geocoded_location: { lat, lng },
        tier_1_within_1km: tier1,
        tier_2_within_2km: tier2,
        tier_3_beyond_2km: tier3,
        summary: {
          total: stores.length,
          within_1km: tier1.length,
          within_2km: tier2.length,
          beyond_2km: tier3.length,
        },
      });
    } catch (err) {
      console.error("Search by address error:", err);
      res.status(500).json({ error: err.message });
    }
  },

 // ==================== ADD TO FAVOURITES ====================
  async addToFavourite(req, res) {
    try {
      const { storeId } = req.params;
      const userId = req.user.id;

      const existing = await Favourite.isFavourited(userId, storeId);
      if (existing) {
        return res.status(400).json({ error: "Store already in favourites" });
      }

      await Favourite.add(userId, storeId);
      res.json({ message: "Added to favourites" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== REMOVE FROM FAVOURITES ====================
  async removeFromFavourite(req, res) {
    try {
      const { storeId } = req.params;
      const userId = req.user.id;

      const removed = await Favourite.remove(userId, storeId);
      if (!removed) {
        return res.status(404).json({ error: "Favourite not found" });
      }

      res.json({ message: "Removed from favourites" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== GET MY FAVOURITES ====================
  async getMyFavourites(req, res) {
    try {
      const userId = req.user.id;
      const favourites = await Favourite.getUserFavourites(userId);
      res.json(favourites);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== CHECK IF STORE IS FAVOURITED ====================
  async checkFavourite(req, res) {
    try {
      const { storeId } = req.params;
      const userId = req.user.id;

      const isFav = await Favourite.isFavourited(userId, storeId);
      res.json({ isFavourited: isFav });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== ROLL DICE BY ADDRESS ====================
  async rollDiceByAddress(req, res) {
    try {
      const { address, cuisine } = req.query;

      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      const geoResponse = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: `${address}, Singapore`,
            format: "json",
            limit: 1,
            countrycodes: "sg",
          },
          headers: { "User-Agent": "EatWhereApp/1.0" },
        },
      );

      if (!geoResponse.data || geoResponse.data.length === 0) {
        return res.status(404).json({ error: "Address not found" });
      }

      const lat = parseFloat(geoResponse.data[0].lat);
      const lng = parseFloat(geoResponse.data[0].lon);

      let stores = await Store.findAll();

      if (cuisine && cuisine !== "All") {
        stores = stores.filter((s) => {
          if (!s.cuisine) return false;

          let storeCuisines;
          if (Array.isArray(s.cuisine)) {
            storeCuisines = s.cuisine;
          } else if (typeof s.cuisine === "string") {
            storeCuisines = s.cuisine.split(", ");
          } else {
            return false;
          }

          return storeCuisines.includes(cuisine);
        });
      }

      const nearbyStores = [];

      stores.forEach((store) => {
        if (store.lat && store.lng) {
          const distance = calculateDistance(
            lat,
            lng,
            parseFloat(store.lat),
            parseFloat(store.lng),
          );
          if (distance <= 2.5) {
            nearbyStores.push({
              ...store,
              distance_km: parseFloat(distance.toFixed(2)),
            });
          }
        }
      });

      if (nearbyStores.length === 0) {
        return res.status(404).json({ error: "No stores found nearby" });
      }

      const randomIndex = Math.floor(Math.random() * nearbyStores.length);
      const selectedStore = nearbyStores[randomIndex];

      res.json({
        message: "🎲 The dice has spoken!",
        selected_store: selectedStore,
      });
    } catch (err) {
      console.error("Roll dice error:", err);
      res.status(500).json({ error: err.message });
    }
  },

 // ==================== SEARCH BY COORDINATES ====================
  async searchByCoordinates(req, res) {
    try {
      const { lat, lng, cuisine } = req.query;

      if (!lat || !lng) {
        return res
          .status(400)
          .json({ error: "Latitude and longitude are required" });
      }

      let stores = await Store.findAll();

      if (cuisine && cuisine !== "All") {
        stores = stores.filter((s) => {
          if (!s.cuisine) return false;

          // Handle both string and JSON array formats
          let storeCuisines;
          if (Array.isArray(s.cuisine)) {
            storeCuisines = s.cuisine;
          } else if (typeof s.cuisine === "string") {
            storeCuisines = s.cuisine.split(", ");
          } else {
            return false;
          }

          return storeCuisines.includes(cuisine);
        });
      }

      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      const tier1 = [];
      const tier2 = [];
      const tier3 = [];

      stores.forEach((store) => {
        if (store.lat && store.lng) {
          const distance = calculateDistance(
            userLat,
            userLng,
            parseFloat(store.lat),
            parseFloat(store.lng),
          );
          const storeWithDistance = {
            ...store,
            distance_km: parseFloat(distance.toFixed(2)),
          };

          if (distance <= 1) tier1.push(storeWithDistance);
          else if (distance <= 2) tier2.push(storeWithDistance);
          else if (distance <= 2.5) tier3.push(storeWithDistance);
        }
      });

      tier1.sort((a, b) => a.distance_km - b.distance_km);
      tier2.sort((a, b) => a.distance_km - b.distance_km);
      tier3.sort((a, b) => a.distance_km - b.distance_km);

      res.json({
        searched_location: { lat: userLat, lng: userLng },
        tier_1_within_1km: tier1,
        tier_2_within_2km: tier2,
        tier_3_beyond_2km: tier3,
        summary: {
          total: stores.length,
          within_1km: tier1.length,
          within_2km: tier2.length,
          beyond_2km: tier3.length,
        },
      });
    } catch (err) {
      console.error("Search by coordinates error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== ROLL DICE BY COORDINATES ====================
  async rollDiceByCoordinates(req, res) {
    try {
      const { lat, lng, cuisine } = req.query;

      if (!lat || !lng) {
        return res
          .status(400)
          .json({ error: "Latitude and longitude are required" });
      }

      let stores = await Store.findAll();

      if (cuisine && cuisine !== "All") {
        stores = stores.filter((s) => {
          if (!s.cuisine) return false;

          // Handle both string and JSON array formats
          let storeCuisines;
          if (Array.isArray(s.cuisine)) {
            storeCuisines = s.cuisine;
          } else if (typeof s.cuisine === "string") {
            storeCuisines = s.cuisine.split(", ");
          } else {
            return false;
          }

          return storeCuisines.includes(cuisine);
        });
      }

      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      const nearbyStores = [];

      stores.forEach((store) => {
        if (store.lat && store.lng) {
          const distance = calculateDistance(
            userLat,
            userLng,
            parseFloat(store.lat),
            parseFloat(store.lng),
          );
          if (distance <= 2.5) {
            nearbyStores.push({
              ...store,
              distance_km: parseFloat(distance.toFixed(2)),
            });
          }
        }
      });

      if (nearbyStores.length === 0) {
        return res.status(404).json({ error: "No stores found nearby" });
      }

      const randomIndex = Math.floor(Math.random() * nearbyStores.length);
      const selectedStore = nearbyStores[randomIndex];

      res.json({
        message: "🎲 The dice has spoken!",
        selected_store: selectedStore,
      });
    } catch (err) {
      console.error("Roll dice error:", err);
      res.status(500).json({ error: err.message });
    }
  },

   // =================GET ALL STORES (NO FILTERS - FOR ADMIN)=================
  async getAllStoresSimple(req, res) {
    try {
      const stores = await Store.findAll();
      res.json(stores);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  //================================== FOR DELETING A STORE==================================
  async deleteStore(req, res) {
    try {
      const deleted = await Store.delete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Store not found" });
      res.json({ message: "Store deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};