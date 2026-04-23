import express from 'express';
import { StoreController } from '../controllers/storeController.js';
import { authMiddleware, adminMiddleware, ownerMiddleware } from '../middleware/authMiddleware.js'; // Added ownerMiddleware

const router = express.Router();

// FOR POPULATING DATA VIA THUNDER CLIENT
router.post('/seed', authMiddleware, adminMiddleware, StoreController.seed);

// SPECIAL ROUTES (must come before /:id)
router.get('/search-by-address', StoreController.searchByAddress);
router.get('/roll-dice', StoreController.rollDiceByAddress);
router.get('/top-picks', StoreController.getTopPicks);
router.get('/search-by-coordinates', StoreController.searchByCoordinates);
router.get('/roll-dice-by-coordinates', StoreController.rollDiceByCoordinates);

// ==================== FAVOURITES (must come BEFORE /:storeId) ====================
router.get('/favourites', authMiddleware, StoreController.getMyFavourites);  
router.get('/all', StoreController.getAllStoresSimple);

// ==================== FAVOURITES WITH STORE ID ====================
router.post('/:storeId/favourite', authMiddleware, StoreController.addToFavourite);
router.delete('/:storeId/favourite', authMiddleware, StoreController.removeFromFavourite);
router.get('/:storeId/favourite/check', authMiddleware, StoreController.checkFavourite);

// ==================== TOP PICK TOGGLE (Admin only) ====================
router.put('/:id/top-pick', authMiddleware, adminMiddleware, StoreController.toggleTopPick);

// STANDARD CRUD (Protected with One-Brain Logic)
router.get('/', StoreController.getAllStores);
router.get('/:id', StoreController.getStore);

// SURGERY: Added protection so only Owners/Admins can Create, Update, or Delete
router.post('/', authMiddleware, ownerMiddleware, StoreController.createStore);
router.put('/:id', authMiddleware, ownerMiddleware, StoreController.updateStore);
router.delete('/:id', authMiddleware, ownerMiddleware, StoreController.deleteStore);

// ==================== STORE IMAGES ====================
router.post('/images', authMiddleware, ownerMiddleware, StoreController.addStoreImage);
router.get('/:storeId/images', StoreController.getStoreImages);
router.delete('/:storeId/images/:imageId', authMiddleware, ownerMiddleware, StoreController.deleteStoreImage);

export default router;