import { OwnershipRequest } from '../models/ownershipRequestModel.js';
import db from '../config/db.js';

// ==================== OWNERSHIP CONTROLLER ====================
export const OwnershipController = {

  // ==================== SUBMIT OWNERSHIP REQUEST ====================
  async submitRequest(req, res) {
    try {
      const {
        username,
        email,
        contact_number,
        store_name,
        store_address,
        id_type,
        passport_image,
        id_front_image,
        id_back_image,
        acra_image
      } = req.body;
      const user_id = req.user.id;

      if (!username || !email || !contact_number || !store_name || !store_address || !id_type || !acra_image) {
        return res.status(400).json({ error: 'All required fields must be filled' });
      }

      if (id_type === 'passport' && !passport_image) {
        return res.status(400).json({ error: 'Passport image is required' });
      }

      if (id_type === 'id_card' && (!id_front_image || !id_back_image)) {
        return res.status(400).json({ error: 'Both front and back of ID are required' });
      }

      const requestId = await OwnershipRequest.create({
        user_id,
        username,
        email,
        contact_number,
        store_name,
        store_address,
        id_type,
        passport_image,
        id_front_image,
        id_back_image,
        acra_image
      });

      res.status(201).json({
        message: 'Ownership request submitted successfully',
        requestId
      });
    } catch (err) {
      console.error('Submit request error:', err);
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== GET USER'S REQUESTS ====================
  async getMyRequests(req, res) {
    try {
      const user_id = req.user.id;
      const requests = await OwnershipRequest.getByUserId(user_id);
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ==================== GET ALL PENDING REQUESTS (ADMIN) ====================
  async getPendingRequests(req, res) {
    try {
      console.log("🔵 [Controller] getPendingRequests called");
      
      // Direct SQL test to see what's in the table
      const [allRequests] = await db.execute("SELECT * FROM ownership_requests");
      console.log("🔵 [Controller] ALL ownership_requests:", allRequests);
      console.log("🔵 [Controller] ALL requests count:", allRequests.length);
      
      const requests = await OwnershipRequest.getPendingRequests();
      console.log("🔵 [Controller] getPendingRequests result:", requests);
      console.log("🔵 [Controller] Pending requests count:", requests.length);
      
      res.json(requests);
    } catch (err) {
      console.error("🔴 [Controller] Error in getPendingRequests:", err);
      res.status(500).json({ error: err.message });
    }
  },

 // ==================== UPDATE REQUEST STATUS (ADMIN) ====================
async updateRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, admin_notes, store_id } = req.body;

    const request = await OwnershipRequest.getById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const updated = await OwnershipRequest.updateStatus(id, status, admin_notes);
    if (!updated) {
      return res.status(404).json({ error: 'Failed to update request' });
    }

    if (status === 'approved') {
      let finalStoreId = store_id;

      if (!finalStoreId) {
        const [storeResult] = await db.execute(
          `INSERT INTO stores (name, country, address, operating) 
           VALUES (?, 'Singapore', ?, 1)`,
          [request.store_name, request.store_address]
        );
        finalStoreId = storeResult.insertId;
      }
      
      await db.execute(
        "UPDATE users SET role = 'owner' WHERE id = ?",
        [request.user_id]
      );

      await db.execute(
        "UPDATE stores SET owner_id = ? WHERE id = ?",
        [request.user_id, finalStoreId]
      );

      const [existing] = await db.execute(
        'SELECT id FROM store_owners WHERE user_id = ? AND store_id = ?',
        [request.user_id, finalStoreId]
      );

      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO store_owners (user_id, store_id, is_approved, approved_at) 
           VALUES (?, ?, TRUE, NOW())`,
          [request.user_id, finalStoreId]
        );
      }
    }

    res.json({ message: `Request ${status} successfully and user promoted to owner` });
  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({ error: err.message });
  }
}
};