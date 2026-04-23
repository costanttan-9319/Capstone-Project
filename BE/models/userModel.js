import db from '../config/db.js';
import bcrypt from 'bcryptjs';

export const User = {

  // ==================== CREATE USER ====================
  async create({ email, username, date_of_birth, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO users (email, username, date_of_birth, password)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [email, username, date_of_birth, hashedPassword]);
    return result.insertId;
  },

  // ==================== UPDATE USER PROFILE ====================
async updateProfile(userId, { email, username, date_of_birth }) {
  const sql = `
    UPDATE users 
    SET email = ?, username = ?, date_of_birth = ?
    WHERE id = ?
  `;
  await db.execute(sql, [email, username, date_of_birth, userId]);
},

  // ==================== FIND USER BY EMAIL ====================
async findByEmail(email) {
  const [rows] = await db.execute('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
  return rows[0];
},

  // ==================== FIND USER BY USERNAME ====================
  async findByUsername(username) {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  },

  // ==================== FIND USER BY ID ====================
  async findById(id) {
    const [rows] = await db.execute('SELECT id, email, username, date_of_birth, role, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  // ==================== VERIFY PASSWORD ====================
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  // ==================== DELETE USER ====================
async delete(id) {
  const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
},

  // ==================== SET RESET TOKEN (FORGOT PASSWORD) ====================
async setResetToken(email, token, expiresAt) {
  const sql = `UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE LOWER(email) = LOWER(?)`;
  await db.execute(sql, [token, expiresAt, email]);
},

  // ==================== FIND USER BY RESET TOKEN ====================
  async findByResetToken(token) {
    const sql = `SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()`;
    const [rows] = await db.execute(sql, [token]);
    return rows[0];
  },

  // ==================== UPDATE PASSWORD ====================
  async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const sql = `UPDATE users SET password = ? WHERE id = ?`;
    await db.execute(sql, [hashedPassword, userId]);
  },

  // ==================== CLEAR RESET TOKEN ====================
  async clearResetToken(userId) {
    const sql = `UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?`;
    await db.execute(sql, [userId]);
  }
};