import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// FOR DATABASE CONNECTION
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// FOR CONNECTION TESTING
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL connected successfully to eatwhereapp_db');
    connection.release();
  } catch (err) {
    console.error('MySQL connection error:', err.message);
  }
};

testConnection();

export default pool;