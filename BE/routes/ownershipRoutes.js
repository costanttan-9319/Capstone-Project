import express from 'express';
import { OwnershipController } from '../controllers/ownershipController.js';
import { AdminController } from '../controllers/adminController.js'; 
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js'; // Cleaned up import

const router = express.Router();

// ==================== USER ACTIONS ====================
router.post('/request', authMiddleware, OwnershipController.submitRequest);
router.get('/my-requests', authMiddleware, OwnershipController.getMyRequests);

// ==================== ADMIN ACTIONS (ONE BRAIN) ====================
// SURGERY: Point 'pending' to AdminController so the data format matches the approval logic
router.get('/pending', authMiddleware, adminMiddleware, AdminController.getPendingRequests);

// This is the "One-Click" logic we just perfected
router.put('/:id/status', authMiddleware, adminMiddleware, AdminController.approveRequest);

export default router;