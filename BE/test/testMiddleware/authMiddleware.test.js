import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import db from '../../config/db.js';
import { authMiddleware, adminMiddleware, ownerMiddleware } from '../../middleware/authMiddleware.js';

// Mock dependencies
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock('../../config/db.js', () => ({
  default: {
    execute: vi.fn(),
  },
}));

describe('Auth Middleware', () => {
  let req, res, next;

  // Real tokens for different roles
  const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJjb3N0YW50dGFuQGdtYWlsLmNvbSIsInVzZXJuYW1lIjoiQ29zdGFudDEyMyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NzEyOTcwOSwiZXhwIjoxNzc3NzM0NTA5fQ.eX2S42v0LvK1VyVl5cblt31a5Lsm9nj8u5IPwxdm_bA';
  const ownerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiZW1haWwiOiJUaG9tYXNsaW1AZ21haWwuY29tIiwidXNlcm5hbWUiOiJUaG9tYXNMaW0iLCJyb2xlIjoib3duZXIiLCJpYXQiOjE3NzcxMjk3NTMsImV4cCI6MTc3NzczNDU1M30.JZ4zOxQCoCvEEYIOjqD1xxIbE6KEJP9ECjxad3k-6F0';
  const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiZW1haWwiOiJqYWNreXRhbkBnbWFpbC5jb20iLCJ1c2VybmFtZSI6IkphY2t5VXNlciIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzc3MTMwMDk5LCJleHAiOjE3Nzc3MzQ4OTl9.VAut2dLtT-3eFQYpaw0bztWCQI3X9xrYuvKu06Of1pw';

  // Decoded payloads from the tokens
  const adminDecoded = { id: 1, email: 'costantan@gmail.com', username: 'Costant123', role: 'admin', iat: 1777129709, exp: 1777734509 };
  const ownerDecoded = { id: 5, email: 'Thomaslim@gmail.com', username: 'ThomasLim', role: 'owner', iat: 1777129753, exp: 1777734553 };
  const userDecoded = { id: 7, email: 'jackytan@gmail.com', username: 'JackyUser', role: 'user', iat: 1777130099, exp: 1777734899 };

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  // ==================== authMiddleware ====================
  describe('authMiddleware', () => {
    it('should return 401 if no authorization header', async () => {
      await authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if header does not start with Bearer', async () => {
      req.headers.authorization = 'Basic token';
      await authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalidtoken';
      jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
      await authMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user no longer exists in DB', async () => {
      jwt.verify.mockReturnValue(adminDecoded);
      db.execute.mockResolvedValue([[]]); // no user found
      req.headers.authorization = `Bearer ${adminToken}`;
      await authMiddleware(req, res, next);
      expect(db.execute).toHaveBeenCalledWith(
        'SELECT id, username, email, role FROM users WHERE id = ?',
        [1]
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User no longer exists.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should attach admin user and call next on success', async () => {
      const dbUser = { id: 1, username: 'Costant123', email: 'costantan@gmail.com', role: 'admin' };
      jwt.verify.mockReturnValue(adminDecoded);
      db.execute.mockResolvedValue([[dbUser]]);
      req.headers.authorization = `Bearer ${adminToken}`;
      await authMiddleware(req, res, next);
      expect(req.user).toEqual(dbUser);
      expect(next).toHaveBeenCalled();
    });

    it('should attach owner user and call next on success', async () => {
      const dbUser = { id: 5, username: 'ThomasLim', email: 'Thomaslim@gmail.com', role: 'owner' };
      jwt.verify.mockReturnValue(ownerDecoded);
      db.execute.mockResolvedValue([[dbUser]]);
      req.headers.authorization = `Bearer ${ownerToken}`;
      await authMiddleware(req, res, next);
      expect(req.user).toEqual(dbUser);
      expect(next).toHaveBeenCalled();
    });

    it('should attach regular user and call next on success', async () => {
      const dbUser = { id: 7, username: 'JackyUser', email: 'jackytan@gmail.com', role: 'user' };
      jwt.verify.mockReturnValue(userDecoded);
      db.execute.mockResolvedValue([[dbUser]]);
      req.headers.authorization = `Bearer ${userToken}`;
      await authMiddleware(req, res, next);
      expect(req.user).toEqual(dbUser);
      expect(next).toHaveBeenCalled();
    });
  });

  // ==================== adminMiddleware ====================
  describe('adminMiddleware', () => {
    it('should return 403 if user role is not admin', () => {
      req.user = { role: 'owner' };
      adminMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. Admin only.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for regular user', () => {
      req.user = { role: 'user' };
      adminMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user role is admin', () => {
      req.user = { role: 'admin' };
      adminMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ==================== ownerMiddleware ====================
  describe('ownerMiddleware', () => {
    it('should return 403 if user role is regular user', () => {
      req.user = { role: 'user' };
      ownerMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. Owners only.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user role is owner', () => {
      req.user = { role: 'owner' };
      ownerMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should call next if user role is admin', () => {
      req.user = { role: 'admin' };
      ownerMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});