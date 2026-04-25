import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==================== MOCK SETUP ====================
vi.mock('../../models/storeModel.js', () => ({
  Store: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../models/storeImageModel.js', () => ({
  StoreImage: {
    addImage: vi.fn(),
    getByStoreId: vi.fn(),
    deleteImage: vi.fn(),
    countImages: vi.fn(),
  },
}));

vi.mock('../../models/favouritepageModel.js', () => ({
  Favourite: {
    add: vi.fn(),
    remove: vi.fn(),
    isFavourited: vi.fn(),
    getUserFavourites: vi.fn(),
  },
}));

vi.mock('../../config/db.js', () => ({
  default: { execute: vi.fn() },
  pool: { execute: vi.fn() },
}));

vi.mock('axios');
vi.mock('../../scripts/seedStores.js');
vi.mock('../../config/constants.js', () => ({
  getAreaCoordinates: vi.fn((area) => {
    const coords = {
      'Tampines': { lat: 1.352, lng: 103.944 },
      'Woodlands': { lat: 1.436, lng: 103.786 },
      'Jurong': { lat: 1.333, lng: 103.740 },
    };
    return coords[area] || { lat: 0, lng: 0 };
  }),
}));

// Import after mocks
import { StoreController } from '../../controllers/storeController.js';
import { Store } from '../../models/storeModel.js';
import { Favourite } from '../../models/favouritepageModel.js';
import axios from 'axios';

// ==================== TEST SUITE ====================
describe('Store Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== READ: Get All Stores (Search by Area) ====================
  describe('getAllStores', () => {
    it('should return 400 if area is missing', async () => {
      const req = { query: {} };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.getAllStores(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Missing required fields",
        message: "Please fill in Country and Area",
      });
    });

    it('should return stores with distance tiers', async () => {
      const mockStores = [
        { 
          id: 71, 
          name: 'XW Plus Western Grill - Century Square', 
          area: 'Tampines', 
          lat: 1.35257, 
          lng: 103.94369, 
          cuisine: ['Western'],
          description: 'Western Grill',
          price_range: '$$',
          rating: 5.0,
          image_path: 'https://example.com/image.jpg',
          opening_hours: { Monday: '11:30 AM - 10:00 PM' },
        },
      ];

      Store.findAll.mockResolvedValue(mockStores);

      const req = { query: { area: 'Tampines' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.getAllStores(req, res);

      expect(Store.findAll).toHaveBeenCalled();
      const responseData = res.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('tier_1_within_1km');
      expect(responseData).toHaveProperty('search_area', 'Tampines');
    });

    it('should filter stores by cuisine', async () => {
      const mockStores = [
        { id: 71, name: 'Western Grill', area: 'Tampines', lat: 1.35257, lng: 103.94369, cuisine: ['Western'] },
        { id: 72, name: 'Chinese Restaurant', area: 'Tampines', lat: 1.353, lng: 103.944, cuisine: ['Chinese'] },
      ];

      Store.findAll.mockResolvedValue(mockStores);

      const req = { query: { area: 'Tampines', cuisine: 'Western' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.getAllStores(req, res);

      const responseData = res.json.mock.calls[0][0];
      const allStores = [
        ...(responseData.tier_1_within_1km || []),
        ...(responseData.tier_2_within_2km || []),
        ...(responseData.tier_3_beyond_2km || []),
      ];
      
      expect(allStores.some(store => store.name === 'Western Grill')).toBe(true);
    });
  });

  // ==================== READ: Get Single Store by ID ====================
  describe('getStore', () => {
    it('should return store by id', async () => {
      const mockStore = { id: 71, name: 'XW Plus Western Grill' };
      Store.findById.mockResolvedValue(mockStore);

      const req = { params: { id: 71 } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.getStore(req, res);

      expect(Store.findById).toHaveBeenCalledWith(71);
      expect(res.json).toHaveBeenCalledWith(mockStore);
    });

    it('should return 404 if store not found', async () => {
      Store.findById.mockResolvedValue(null);

      const req = { params: { id: 999 } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.getStore(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Store not found" });
    });
  });

  // ==================== READ: Get Top Picks ====================
  describe('getTopPicks', () => {
    it('should return top pick stores', async () => {
      const mockTopPicks = [
        { id: 71, name: 'XW Plus Western Grill', is_top_pick: 1, price_range: '$$', rating: 5.0 },
        { id: 42, name: 'Songhua River Dragon Banquet House', is_top_pick: 1, price_range: '$$', rating: 4.3 },
      ];

      const db = (await import('../../config/db.js')).default;
      db.execute.mockResolvedValue([mockTopPicks]);

      const req = { query: {} };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.getTopPicks(req, res);

      expect(db.execute).toHaveBeenCalled();
      const responseData = res.json.mock.calls[0][0];
      expect(Array.isArray(responseData)).toBe(true);
      expect(responseData.length).toBe(2);
    });

    it('should filter top picks by area', async () => {
      const mockTopPicks = [
        { id: 71, name: 'XW Plus Western Grill', area: 'Tampines', is_top_pick: 1 },
      ];

      const db = (await import('../../config/db.js')).default;
      db.execute.mockResolvedValue([mockTopPicks]);

      const req = { query: { area: 'Tampines' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.getTopPicks(req, res);

      expect(db.execute).toHaveBeenCalled();
      const responseData = res.json.mock.calls[0][0];
      expect(responseData[0].area).toBe('Tampines');
    });
  });

  // ==================== UPDATE: Toggle Top Pick (Admin Only) ====================
  describe('toggleTopPick', () => {
    it('should toggle top pick status for a store', async () => {
      Store.update.mockResolvedValue(true);

      const req = { params: { id: 71 }, body: { is_top_pick: true }, user: { role: 'admin' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.toggleTopPick(req, res);

      expect(Store.update).toHaveBeenCalledWith(71, { is_top_pick: true });
      expect(res.json).toHaveBeenCalledWith({
        message: "Store added to Top Picks! ⭐",
        is_top_pick: true
      });
    });

    it('should return 400 if is_top_pick value is missing', async () => {
      const req = { params: { id: 71 }, body: {}, user: { role: 'admin' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.toggleTopPick(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "is_top_pick value is required" });
    });
  });

  // ==================== CREATE: Add Store to Favourites ====================
  describe('addToFavourite', () => {
    it('should add store to favourites', async () => {
      Favourite.isFavourited.mockResolvedValue(false);
      Favourite.add.mockResolvedValue(true);

      const req = { params: { storeId: 71 }, user: { id: 1 } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.addToFavourite(req, res);

      expect(Favourite.add).toHaveBeenCalledWith(1, 71);
      expect(res.json).toHaveBeenCalledWith({ message: "Added to favourites" });
    });

    it('should return 400 if already favourited', async () => {
      Favourite.isFavourited.mockResolvedValue(true);

      const req = { params: { storeId: 71 }, user: { id: 1 } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.addToFavourite(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Store already in favourites" });
    });
  });

  // ==================== DELETE: Remove Store from Favourites ====================
  describe('removeFromFavourite', () => {
    it('should remove store from favourites', async () => {
      Favourite.remove.mockResolvedValue(true);

      const req = { params: { storeId: 71 }, user: { id: 1 } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.removeFromFavourite(req, res);

      expect(Favourite.remove).toHaveBeenCalledWith(1, 71);
      expect(res.json).toHaveBeenCalledWith({ message: "Removed from favourites" });
    });
  });

  // ==================== READ: Search by Address (Geocoding) ====================
  describe('searchByAddress', () => {
    it('should return 400 if address missing', async () => {
      const req = { query: {} };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.searchByAddress(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Address is required" });
    });

    it('should return 404 if address not found', async () => {
      axios.get.mockResolvedValue({ data: [] });

      const req = { query: { address: 'Invalid Address' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.searchByAddress(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Address not found" });
    });
  });

  // ==================== READ: Roll Dice (Random Store Picker) ====================
  describe('rollDice', () => {
    it('should return 400 if area missing', async () => {
      const req = { query: {} };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.rollDice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return random store from area', async () => {
      const mockStores = [
        { id: 71, name: 'Western Grill', area: 'Tampines', lat: 1.35257, lng: 103.94369, cuisine: ['Western'] },
        { id: 72, name: 'Chinese Restaurant', area: 'Tampines', lat: 1.353, lng: 103.944, cuisine: ['Chinese'] },
      ];

      Store.findAll.mockResolvedValue(mockStores);

      const req = { query: { area: 'Tampines' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.rollDice(req, res);

      expect(Store.findAll).toHaveBeenCalled();
      const responseData = res.json.mock.calls[0][0];
      expect(responseData).toHaveProperty('selected_store');
      expect(responseData).toHaveProperty('message', '🎲 The dice has spoken!');
    });
  });

  // ==================== DELETE: Delete Store ====================
  describe('deleteStore', () => {
    it('should delete store by id', async () => {
      Store.delete.mockResolvedValue(true);

      const req = { params: { id: 71 } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.deleteStore(req, res);

      expect(Store.delete).toHaveBeenCalledWith(71);
      expect(res.json).toHaveBeenCalledWith({ message: "Store deleted successfully" });
    });

    it('should return 404 if store not found', async () => {
      Store.delete.mockResolvedValue(false);

      const req = { params: { id: 999 } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await StoreController.deleteStore(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Store not found" });
    });
  });
});