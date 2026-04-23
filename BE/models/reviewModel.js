import db from '../config/db.js';

// ==================== REVIEW MODEL ====================
export const Review = {

  // ==================== CREATE REVIEW ====================
  async create({ user_id, store_id, rating, price_rating, comment }) {
    const sql = `
      INSERT INTO reviews (user_id, store_id, rating, price_rating, comment)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      rating = VALUES(rating),
      price_rating = VALUES(price_rating),
      comment = VALUES(comment),
      updated_at = CURRENT_TIMESTAMP
    `;
    const [result] = await db.execute(sql, [user_id, store_id, rating, price_rating, comment]);
    return result.insertId;
  },

  // ==================== GET REVIEW BY USER AND STORE ====================
  async getByUserAndStore(user_id, store_id) {
    const [rows] = await db.execute(
      'SELECT * FROM reviews WHERE user_id = ? AND store_id = ?',
      [user_id, store_id]
    );
    return rows[0];
  },

  // ==================== GET ALL REVIEWS FOR A STORE ====================
  async getByStoreId(store_id) {
    const [rows] = await db.execute(`
      SELECT r.*, u.username 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = ?
      ORDER BY r.created_at DESC
    `, [store_id]);
    return rows;
  },

  // ==================== GET AVERAGE RATING FOR A STORE ====================
  async getAverageRating(store_id) {
    const [rows] = await db.execute(
      'SELECT AVG(rating) as average, COUNT(*) as count FROM reviews WHERE store_id = ?',
      [store_id]
    );
    return {
      average: parseFloat(rows[0].average) || 0,
      count: rows[0].count || 0
    };
  },

  // ==================== DELETE REVIEW ====================
  async delete(user_id, store_id) {
    const [result] = await db.execute(
      'DELETE FROM reviews WHERE user_id = ? AND store_id = ?',
      [user_id, store_id]
    );
    return result.affectedRows > 0;
  }
};