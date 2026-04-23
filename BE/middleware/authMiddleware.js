import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import db from '../config/db.js'; // Added DB import for Live Role Check

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// ==================== AUTHENTICATION MIDDLEWARE ====================
// Verifies JWT token and attaches user to req.user with LIVE DB check
export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // LIVE DB CHECK: Ensure the role in the token matches the current DB role
    const [rows] = await db.execute('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.id]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    // Attach the FRESH database user info to the request
    req.user = rows[0]; 
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ==================== ADMIN MIDDLEWARE ====================
// Checks if user has admin role (must be used after authMiddleware)
export const adminMiddleware = (req, res, next) => {
  // Now using req.user.role which we just fetched fresh from the DB
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// ==================== OWNER MIDDLEWARE (Bonus) ====================
// Use this for routes Thomas needs to access
export const ownerMiddleware = (req, res, next) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Owners only.' });
  }
  next();
};