import db from '../config/db.js';

export const StoreOwner = {

  // ==================== CREATE OWNERSHIP REQUEST ====================
async createRequest({ user_id, store_name, store_address, proof_documents }) {
  console.log('Creating request with:', { user_id, store_name, store_address }); // DEBUG
  
  const sql = `
    INSERT INTO store_owners (user_id, store_name, store_address, proof_documents, is_approved)
    VALUES (?, ?, ?, ?, FALSE)
  `;
  const [result] = await db.execute(sql, [user_id, store_name, store_address, proof_documents]);
  console.log('Insert result:', result); // DEBUG
  return result.insertId;
},

  // ==================== GET ALL PENDING REQUESTS (ADMIN) ====================
  async getPendingRequests() {
    const sql = `
      SELECT so.*, u.email, u.username 
      FROM store_owners so
      JOIN users u ON so.user_id = u.id
      WHERE so.is_approved = FALSE
      ORDER BY so.requested_at DESC
    `;
    const [rows] = await db.execute(sql);
    return rows;
  },

  // ==================== GET ALL REQUESTS (ADMIN) ====================
  async getAllRequests() {
    const sql = `
      SELECT so.*, u.email, u.username 
      FROM store_owners so
      JOIN users u ON so.user_id = u.id
      ORDER BY so.requested_at DESC
    `;
    const [rows] = await db.execute(sql);
    return rows;
  },

 // ==================== APPROVE REQUEST ====================
async approveRequest(requestId, store_id = null) {
  const sql = `
    UPDATE store_owners 
    SET is_approved = TRUE, approved_at = NOW(), store_id = ?
    WHERE id = ?
  `;
  const [result] = await db.execute(sql, [store_id, requestId]);
  return result.affectedRows > 0;
},

// ==================== GET REQUEST BY ID ====================
async getRequestById(id) {
  const [rows] = await db.execute('SELECT * FROM store_owners WHERE id = ?', [id]);
  return rows[0];
},

  // ==================== REJECT REQUEST (DELETE) ====================
  async rejectRequest(requestId) {
    const sql = `DELETE FROM store_owners WHERE id = ?`;
    const [result] = await db.execute(sql, [requestId]);
    return result.affectedRows > 0;
  },

  // ==================== GET STORES OWNED BY USER ====================
  async getUserStores(userId) {
    const sql = `
      SELECT s.* 
      FROM store_owners so
      JOIN stores s ON so.store_id = s.id
      WHERE so.user_id = ? AND so.is_approved = TRUE
    `;
    const [rows] = await db.execute(sql, [userId]);
    return rows;
  },
};