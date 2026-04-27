import db from '../config/db.js';

// ==================== OWNERSHIP REQUEST MODEL ====================
export const OwnershipRequest = {

  // ==================== CREATE REQUEST ====================
  async create({
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
  }) {
    const sql = `
      INSERT INTO ownership_requests (
        user_id, username, email, contact_number, 
        store_name, store_address,
        id_type,
        passport_image, id_front_image, id_back_image, acra_image, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;
    const [result] = await db.execute(sql, [
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
    ]);
    return result.insertId;
  },

  // ==================== GET REQUESTS BY USER ====================
  async getByUserId(user_id) {
    const [rows] = await db.execute(
      'SELECT id, user_id, username, email, contact_number, store_name, store_address, id_type, passport_image, id_front_image, id_back_image, acra_image, status, admin_notes, created_at, updated_at, notified FROM ownership_requests WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    return rows;
  },

  // ==================== GET ALL PENDING REQUESTS (ADMIN) ====================
  async getPendingRequests() {
    // FIXED: Changed double quotes to single quotes for MySQL compatibility
    const [rows] = await db.execute(
      "SELECT * FROM ownership_requests WHERE status = 'pending' ORDER BY created_at ASC"
    );
    console.log("🔵 [Model] getPendingRequests found:", rows.length);
    return rows;
  },

    // ==================== GET PENDING REQUESTS COUNT (ADMIN) ====================
  async getPendingCount() {
    const [rows] = await db.execute(
      "SELECT COUNT(*) as count FROM ownership_requests WHERE status = 'pending'"
    );
    console.log("🔵 [Model] Pending requests count:", rows[0].count);
    return rows[0].count;
  },

  // ==================== UPDATE REQUEST STATUS (ADMIN) ====================
  async updateStatus(id, status, admin_notes = null) {
    const sql = `
      UPDATE ownership_requests 
      SET status = ?, admin_notes = ?
      WHERE id = ?
    `;
    const [result] = await db.execute(sql, [status, admin_notes, id]);
    return result.affectedRows > 0;
  },

  // ==================== GET REQUEST BY ID ====================
  async getById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM ownership_requests WHERE id = ?',
      [id]
    );
    return rows[0];
  }
};