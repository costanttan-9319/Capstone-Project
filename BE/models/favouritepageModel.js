import db from '../config/db.js';

export const Favourite = {

  // ==================== ADD TO FAVOURITES ====================
  async add(userId, storeId) {
    const sql = `
      INSERT INTO favourites (user_id, store_id)
      VALUES (?, ?)
    `;
    const [result] = await db.execute(sql, [userId, storeId]);
    return result.insertId;
  },

  // ==================== REMOVE FROM FAVOURITES ====================
  async remove(userId, storeId) {
    const sql = `
      DELETE FROM favourites 
      WHERE user_id = ? AND store_id = ?
    `;
    const [result] = await db.execute(sql, [userId, storeId]);
    return result.affectedRows > 0;
  },

  // ==================== GET USER FAVOURITES ====================
  async getUserFavourites(userId) {
    const sql = `
      SELECT s.*, f.created_at as favourited_at
      FROM favourites f
      JOIN stores s ON f.store_id = s.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `;
    const [rows] = await db.execute(sql, [userId]);
    return rows;
  },

  // ==================== CHECK IF STORE IS FAVOURITED ====================
  async isFavourited(userId, storeId) {
    const sql = `
      SELECT id FROM favourites 
      WHERE user_id = ? AND store_id = ?
    `;
    const [rows] = await db.execute(sql, [userId, storeId]);
    return rows.length > 0;
  },

  // ==================== GET FAVOURITE COUNT FOR STORE ====================
  async getFavouriteCount(storeId) {
    const sql = `
      SELECT COUNT(*) as count FROM favourites 
      WHERE store_id = ?
    `;
    const [rows] = await db.execute(sql, [storeId]);
    return rows[0].count;
  }
};