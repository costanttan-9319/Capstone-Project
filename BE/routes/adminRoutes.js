import express from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==================== ADMIN ONLY ROUTES ====================
router.use(authMiddleware, adminMiddleware);

router.get('/requests/pending', AdminController.getPendingRequests);
router.get('/requests/all', AdminController.getAllRequests);
router.get('/requests/pending-count', AdminController.getPendingCount);

// SURGERY: Changed path from '/requests/:id/approve' to '/:id/status' 
// to match the Frontend api.put(`/ownership/${requestId}/status`)
router.put('/:id/status', AdminController.approveRequest); 

router.delete('/requests/:id/reject', AdminController.rejectRequest);

export default router;