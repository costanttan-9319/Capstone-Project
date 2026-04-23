import db from '../config/db.js';


//========================GETTING IMAGES FOR STORES========================
export const StoreImage = {
  async getByStoreId(storeId) {
    const [rows] = await db.execute(
      'SELECT * FROM store_images WHERE store_id = ? ORDER BY display_order',
      [storeId]
    );
    return rows;
  },


  //========================ADD IMAGE TO STORES========================
  async addImage(storeId, imageUrl, displayOrder) {
    const [result] = await db.execute(
      'INSERT INTO store_images (store_id, image_url, display_order) VALUES (?, ?, ?)',
      [storeId, imageUrl, displayOrder]
    );
    return result.insertId;
  },

  //========================DELETE IMAGES FROM STORE========================
  async deleteImage(imageId, storeId) {
    const [result] = await db.execute(
      'DELETE FROM store_images WHERE id = ? AND store_id = ?',
      [imageId, storeId]
    );
    return result.affectedRows > 0;
  },

  //========================IMAGE COUNT========================
  async countImages(storeId) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM store_images WHERE store_id = ?',
      [storeId]
    );
    return rows[0].count;
  }
};