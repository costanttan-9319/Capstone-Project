import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================
router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// ==================== PROTECTED ROUTES (require login) ====================
router.get('/me', authMiddleware, AuthController.getMe);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.delete('/delete', authMiddleware, AuthController.deleteAccount); 
router.post('/change-password', authMiddleware, AuthController.changePassword);

export default router;