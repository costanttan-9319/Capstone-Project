import db from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

// Helper function to safely parse JSON fields
const parseJSONField = (value, defaultValue = null) => {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch {
    return value; // Return as-is if not JSON
  }
};

// Helper function to convert MySQL TINYINT to boolean
const toBoolean = (value) => {
  if (value === null || value === undefined) return false;
  return value === 1 || value === true;
};

// FOR STORE DATA LOGIC
export const Store = {

// FOR CREATING NEW STORES (Now purely dynamic, matching your update style)
  async create(data) {
    try {
      const fields = [];
      const placeholders = [];
      const values = [];

      // Loop through and build query. No more internal rules/stringify.
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          fields.push(`\`${key}\``);
          placeholders.push('?');
          values.push(value); 
        }
      }

      if (fields.length === 0) return false;

      const sql = `INSERT INTO stores (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;

      console.log("🚀 Executing Pure Dynamic Create SQL:", sql);
      console.log("📦 With Values:", values);

      const [result] = await db.execute(sql, values);
      return result.insertId;
    } catch (err) {
      console.error("❌ Model Create Error:", err.message);
      throw err;
    }
  },

  // FOR FETCHING ALL STORES
  async findAll() {
    const [rows] = await db.execute('SELECT * FROM stores');
    return rows.map(row => ({
      ...row,
      is_top_pick: toBoolean(row.is_top_pick),
      images: parseJSONField(row.images, []),
      cuisine: parseJSONField(row.cuisine, []),
      opening_hours: parseJSONField(row.opening_hours, {}),
      social_media: parseJSONField(row.social_media, {})
    }));
  },

  // FOR FETCHING BY ID
  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM stores WHERE id = ?', [id]);
    if (!rows[0]) return null;
    
    return {
      ...rows[0],
      is_top_pick: toBoolean(rows[0].is_top_pick),
      images: parseJSONField(rows[0].images, []),
      cuisine: parseJSONField(rows[0].cuisine, []),
      opening_hours: parseJSONField(rows[0].opening_hours, {}),
      social_media: parseJSONField(rows[0].social_media, {})
    };
  },

 // FOR UPDATING STORES
async update(id, data) {
    const fields = [];
    const values = [];

    // Loop through the data and only add valid keys
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) { // Strictly skip undefined
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    values.push(id); // ID must be the LAST value in the array

    const sql = `UPDATE stores SET ${fields.join(', ')} WHERE id = ?`;

    // Log this to your terminal so you can see the magic happening
    console.log("Executing SQL:", sql);
    console.log("With Values:", values);

    const [result] = await db.execute(sql, values);
    return result.affectedRows > 0;
  },

  // FOR DELETING STORES
  async delete(id) {
    const [result] = await db.execute('DELETE FROM stores WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};