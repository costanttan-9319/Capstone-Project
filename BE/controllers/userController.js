import { User } from '../models/userModel.js';
import db from '../config/db.js';

export const UserController = {
  // =========================CREATE=========================
  async createUser(req, res) {
    try {
      const userId = await User.create(req.body);
      res.status(201).json({ message: 'User created', userId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // =========================READ ALL=========================
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // =========================READ ONE=========================
  async getUser(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ============================UPDATE=========================
  async updateUser(req, res) {
    try {
      const updated = await User.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'User updated' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  //=================================DELETE================================
  async deleteUser(req, res) {
    try {
      const deleted = await User.delete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'User deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== GET MY STORES (OWNER) ====================
async getMyStores(req, res) {
  try {
    const userId = req.user.id;
    
    const [stores] = await db.execute(`
      SELECT s.*, 
             CASE WHEN s.owner_id = ? THEN TRUE ELSE FALSE END as is_primary_owner,
             TRUE as is_co_owner
      FROM stores s
      JOIN store_owners so ON s.id = so.store_id
      WHERE so.user_id = ? AND so.is_approved = TRUE
    `, [userId, userId]);
    
    // Add a unified flag for frontend
    const storesWithFlags = stores.map(store => ({
      ...store,
      is_owner: true,  // User can edit this store
      is_co_owner: store.is_primary_owner === 0
    }));
    
    console.log(`🔵 User ${userId} has ${storesWithFlags.length} stores (primary + co-owner)`);
    res.json(storesWithFlags);
  } catch (err) {
    console.error("🔴 Error in getMyStores:", err);
    res.status(500).json({ error: err.message });
  }
},

  // ========SPECIAL: MAKE OWNER (Matches router.patch('/:id/make-owner'))=========
  async makeUserOwner(req, res) {
    try {
      const { store_id } = req.body; // Expecting { "store_id": 11 }
      if (!store_id) return res.status(400).json({ error: 'store_id is required' });

      const success = await User.makeOwner(req.params.id, store_id);
      if (!success) return res.status(404).json({ error: 'User not found' });
      
      res.json({ message: `User ${req.params.id} is now owner of store ${store_id}` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ===========SPECIAL: MAKE ADMIN (Matches router.patch('/:id/make-admin'))=========
  async makeUserAdmin(req, res) {
    try {
      const success = await User.makeAdmin(req.params.id);
      if (!success) return res.status(404).json({ error: 'User not found' });
      
      res.json({ message: `User ${req.params.id} promoted to Admin` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};