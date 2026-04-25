import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==================== MOCK SETUP ====================
vi.mock('../../models/userModel.js', () => ({
  User: {
    create: vi.fn(),
    findByEmail: vi.fn(),
    findByUsername: vi.fn(),
    findById: vi.fn(),
    updateProfile: vi.fn(),
    updatePassword: vi.fn(),
    verifyPassword: vi.fn(),
    delete: vi.fn(),
    setResetToken: vi.fn(),
    findByResetToken: vi.fn(),
    clearResetToken: vi.fn(),
  },
}));

vi.mock('../../config/db.js', () => ({
  default: { execute: vi.fn() },
  pool: { execute: vi.fn() },
}));

vi.mock('../../utils/emailService.js', () => ({
  sendResetEmail: vi.fn().mockResolvedValue(true),
}));

// No need to mock jsonwebtoken – we only check that a token string exists
vi.mock('bcryptjs', async () => {
  const actual = await vi.importActual('bcryptjs');
  return {
    ...actual,
    default: {
      hash: vi.fn().mockResolvedValue('hashed_password'),
      compare: vi.fn(),
    },
  };
});

// Import after mocks
import { AuthController } from '../../controllers/authController.js';
import { User } from '../../models/userModel.js';
import { sendResetEmail } from '../../utils/emailService.js';
import bcryptjs from 'bcryptjs';

// ==================== TEST SUITE ====================
describe('Auth Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default values for common mocks
    bcryptjs.compare.mockResolvedValue(true);
    User.verifyPassword.mockResolvedValue(true);
  });

  // ==================== CREATE: Signup ====================
  describe('signup', () => {
    it('should return 400 if required fields are missing', async () => {
      const req = { body: { email: 'test@example.com' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'All fields are required' });
    });

    it('should return 400 if password is too short (< 6 chars)', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          username: 'testuser',
          date_of_birth: '25/12/1990',
          password: '123',
        },
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Password must be at least 6 alphanumeric characters',
      });
    });

    it('should return 400 if email already exists', async () => {
      User.findByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });

      const req = {
        body: {
          email: 'test@example.com',
          username: 'testuser',
          date_of_birth: '25/12/1990',
          password: 'password123',
        },
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' });
    });

    it('should return 400 if username already exists', async () => {
      User.findByEmail.mockResolvedValue(null);
      User.findByUsername.mockResolvedValue({ id: 1, username: 'testuser' });

      const req = {
        body: {
          email: 'test@example.com',
          username: 'testuser',
          date_of_birth: '25/12/1990',
          password: 'password123',
        },
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Username already taken' });
    });

    it('should create user and return token on successful signup', async () => {
      User.findByEmail.mockResolvedValue(null);
      User.findByUsername.mockResolvedValue(null);
      User.create.mockResolvedValue(1);

      const req = {
        body: {
          email: 'test@example.com',
          username: 'testuser',
          date_of_birth: '25/12/1990',
          password: 'password123',
        },
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.signup(req, res);

      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User created successfully',
          token: expect.any(String),
          user: expect.objectContaining({
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
            role: 'user',
          }),
        })
      );
    });
  });

  // ==================== READ: Login ====================
  describe('login', () => {
    it('should return 400 if email or password missing', async () => {
      const req = { body: { email: 'test@example.com' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password required' });
    });

    it('should return 401 if user not found', async () => {
      User.findByEmail.mockResolvedValue(null);

      const req = { body: { email: 'wrong@example.com', password: 'password123' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
    });

    it('should return 401 if password is invalid', async () => {
      User.findByEmail.mockResolvedValue({ id: 1, email: 'test@example.com', password: 'hashed' });
      User.verifyPassword.mockResolvedValueOnce(false); // override default true

      const req = { body: { email: 'test@example.com', password: 'wrongpassword' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
    });

    it('should return token on successful login', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed',
        role: 'user',
      };
      User.findByEmail.mockResolvedValue(mockUser);
      User.verifyPassword.mockResolvedValue(true); // ensure it's true

      const req = { body: { email: 'test@example.com', password: 'password123' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          token: expect.any(String),
          user: expect.objectContaining({
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
            role: 'user',
          }),
        })
      );
    });
  });

  // ==================== READ: Get Current User ====================
  describe('getMe', () => {
    it('should return current user profile', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        date_of_birth: '1990-12-25',
        role: 'user',
        created_at: '2024-01-01',
      };
      User.findById.mockResolvedValue(mockUser);

      const req = { user: { id: 1 } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.getMe(req, res);

      expect(User.findById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        date_of_birth: '25/12/1990',
        role: 'user',
        created_at: '2024-01-01',
      });
    });

    it('should return 404 if user not found', async () => {
      User.findById.mockResolvedValue(null);

      const req = { user: { id: 999 } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });

  // ==================== UPDATE: Update Profile ====================
  describe('updateProfile', () => {
    it('should return 400 if email already taken by another user', async () => {
      User.findByEmail.mockResolvedValue({ id: 2, email: 'taken@example.com' });

      const req = {
        user: { id: 1 },
        body: { email: 'taken@example.com', username: 'testuser', date_of_birth: '25/12/1990' },
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already taken' });
    });

    it('should return 400 if username already taken by another user', async () => {
      User.findByEmail.mockResolvedValue(null);
      User.findByUsername.mockResolvedValue({ id: 2, username: 'takenuser' });

      const req = {
        user: { id: 1 },
        body: { email: 'test@example.com', username: 'takenuser', date_of_birth: '25/12/1990' },
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Username already taken' });
    });

    it('should update profile successfully', async () => {
      User.findByEmail.mockResolvedValue(null);
      User.findByUsername.mockResolvedValue(null);
      User.updateProfile.mockResolvedValue(true);

      const req = {
        user: { id: 1 },
        body: { email: 'newemail@example.com', username: 'newuser', date_of_birth: '25/12/1990' },
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.updateProfile(req, res);

      expect(User.updateProfile).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: 'Profile updated successfully',
        user: {
          email: 'newemail@example.com',
          username: 'newuser',
          date_of_birth: '25/12/1990',
        },
      });
    });
  });

  // ==================== UPDATE: Change Password ====================
  describe('changePassword', () => {
    it('should return 401 if old password is incorrect', async () => {
      const mockUser = { id: 1, password: 'hashed' };
      User.findById.mockResolvedValue(mockUser);
      User.verifyPassword.mockResolvedValueOnce(false); // override

      const req = {
        user: { id: 1 },
        body: { oldPassword: 'wrong', newPassword: 'newpassword123' },
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Current password is incorrect' });
    });

    it('should change password successfully', async () => {
      const mockUser = { id: 1, password: 'hashed' };
      User.findById.mockResolvedValue(mockUser);
      User.verifyPassword.mockResolvedValue(true);
      User.updatePassword.mockResolvedValue(true);

      const req = {
        user: { id: 1 },
        body: { oldPassword: 'old123', newPassword: 'newpassword123' },
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.changePassword(req, res);

      expect(User.updatePassword).toHaveBeenCalledWith(1, 'newpassword123');
      expect(res.json).toHaveBeenCalledWith({ message: 'Password changed successfully' });
    });
  });

  // ==================== CREATE: Forgot Password ====================
  describe('forgotPassword', () => {
    it('should return 400 if email is missing', async () => {
      const req = { body: {} };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' });
    });

    it('should return 404 if email not found', async () => {
      User.findByEmail.mockResolvedValue(null);

      const req = { body: { email: 'notfound@example.com' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email not found' });
    });

    it('should send reset email successfully', async () => {
      User.findByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' });
      User.setResetToken.mockResolvedValue(true);
      sendResetEmail.mockResolvedValue(true);

      const req = { body: { email: 'test@example.com' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.forgotPassword(req, res);

      expect(User.setResetToken).toHaveBeenCalled();
      expect(sendResetEmail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Password reset link sent to your email' });
    });
  });

  // ==================== UPDATE: Reset Password ====================
  describe('resetPassword', () => {
    it('should return 400 if token or newPassword missing', async () => {
      const req = { body: { token: '123' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token and new password required' });
    });

    it('should return 400 if password is too short (< 6 chars)', async () => {
      const req = { body: { token: '123', newPassword: '123' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Password must be at least 6 characters' });
    });

    it('should return 400 if password doesn\'t contain letters and numbers', async () => {
      const req = { body: { token: '123456', newPassword: 'abcdef' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Password must contain both letters and numbers' });
    });

    it('should return 400 if token is invalid or expired', async () => {
      User.findByResetToken.mockResolvedValue(null);

      const req = { body: { token: 'invalid', newPassword: 'password123' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });

    it('should reset password successfully', async () => {
      User.findByResetToken.mockResolvedValue({ id: 1 });
      User.updatePassword.mockResolvedValue(true);
      User.clearResetToken.mockResolvedValue(true);

      const req = { body: { token: 'valid-token', newPassword: 'password123' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.resetPassword(req, res);

      expect(User.updatePassword).toHaveBeenCalled();
      expect(User.clearResetToken).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Password reset successful. Please login.' });
    });
  });

  // ==================== DELETE: Delete Account ====================
  describe('deleteAccount', () => {
    it('should delete user account successfully', async () => {
      User.delete.mockResolvedValue(true);

      const req = { user: { id: 1 } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AuthController.deleteAccount(req, res);

      expect(User.delete).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ message: 'Account deleted successfully' });
    });
  });
});