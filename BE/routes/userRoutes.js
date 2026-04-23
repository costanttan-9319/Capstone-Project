import express from 'express';
import { UserController } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-stores', authMiddleware, UserController.getMyStores);

router.post('/', UserController.createUser);           // CREATE
router.get('/', UserController.getAllUsers);            // READ ALL
router.get('/:id', UserController.getUser);             // READ ONE
router.put('/:id', UserController.updateUser);          // UPDATE
router.delete('/:id', UserController.deleteUser);       // DELETE


// Special operations
router.patch('/:id/make-owner', UserController.makeUserOwner);  // Make owner of store
router.patch('/:id/make-admin', UserController.makeUserAdmin);  // Make admin

export default router;