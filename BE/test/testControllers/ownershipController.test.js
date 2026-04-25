import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==================== MOCK SETUP ====================
vi.mock('../../models/ownershipRequestModel.js', () => ({
  OwnershipRequest: {
    create: vi.fn(),
    getByUserId: vi.fn(),
    getPendingRequests: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('../../config/db.js', () => ({
  default: { execute: vi.fn() },
  pool: { execute: vi.fn() },
}));

// Import after mocks
import { OwnershipController } from '../../controllers/ownershipController.js';
import { OwnershipRequest } from '../../models/ownershipRequestModel.js';
import db from '../../config/db.js';

// ==================== TEST SUITE ====================
describe('Ownership Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== CREATE: Submit Ownership Request ====================
  describe('submitRequest', () => {
    it('should return 400 if required fields are missing', async () => {
      const req = { 
        body: { username: 'testuser' },
        user: { id: 1 }
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await OwnershipController.submitRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'All required fields must be filled' });
    });

    it('should return 400 if passport image missing when id_type is passport', async () => {
      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          contact_number: '91234567',
          store_name: 'Test Store',
          store_address: '123 Test St',
          id_type: 'passport',
          acra_image: 'data:image...',
        },
        user: { id: 1 }
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await OwnershipController.submitRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Passport image is required' });
    });

    it('should return 400 if ID card images missing when id_type is id_card', async () => {
      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          contact_number: '91234567',
          store_name: 'Test Store',
          store_address: '123 Test St',
          id_type: 'id_card',
          acra_image: 'data:image...',
        },
        user: { id: 1 }
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await OwnershipController.submitRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Both front and back of ID are required' });
    });

    it('should submit request successfully with passport', async () => {
      OwnershipRequest.create.mockResolvedValue(1);

      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          contact_number: '91234567',
          store_name: 'Test Store',
          store_address: '123 Test St',
          id_type: 'passport',
          passport_image: 'data:image/passport...',
          acra_image: 'data:image/acra...',
        },
        user: { id: 1 }
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await OwnershipController.submitRequest(req, res);

      expect(OwnershipRequest.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ownership request submitted successfully',
        requestId: 1
      });
    });

    it('should submit request successfully with ID card', async () => {
      OwnershipRequest.create.mockResolvedValue(2);

      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          contact_number: '91234567',
          store_name: 'Test Store',
          store_address: '123 Test St',
          id_type: 'id_card',
          id_front_image: 'data:image/front...',
          id_back_image: 'data:image/back...',
          acra_image: 'data:image/acra...',
        },
        user: { id: 1 }
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await OwnershipController.submitRequest(req, res);

      expect(OwnershipRequest.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // ==================== READ: Get User's Own Requests ====================
  describe('getMyRequests', () => {
    it('should return user\'s ownership requests', async () => {
      const mockRequests = [
        { id: 1, store_name: 'Test Store', status: 'pending' },
        { id: 2, store_name: 'Another Store', status: 'approved' },
      ];
      OwnershipRequest.getByUserId.mockResolvedValue(mockRequests);

      const req = { user: { id: 1 } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await OwnershipController.getMyRequests(req, res);

      expect(OwnershipRequest.getByUserId).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    it('should return empty array if no requests', async () => {
      OwnershipRequest.getByUserId.mockResolvedValue([]);

      const req = { user: { id: 1 } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await OwnershipController.getMyRequests(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  // ==================== READ: Get Pending Requests (Admin) ====================
  describe('getPendingRequests', () => {
    it('should return all pending requests for admin', async () => {
      const mockPending = [
        { id: 1, store_name: 'Pending Store', status: 'pending' },
        { id: 2, store_name: 'Another Pending', status: 'pending' },
      ];
      OwnershipRequest.getPendingRequests.mockResolvedValue(mockPending);
      db.execute.mockResolvedValue([mockPending]);

      const req = {};
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await OwnershipController.getPendingRequests(req, res);

      expect(OwnershipRequest.getPendingRequests).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockPending);
    });

    it('should return empty array if no pending requests', async () => {
      OwnershipRequest.getPendingRequests.mockResolvedValue([]);
      db.execute.mockResolvedValue([[]]);

      const req = {};
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await OwnershipController.getPendingRequests(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  // ==================== UPDATE: Approve Ownership Request (Admin) ====================
  describe('updateRequestStatus', () => {
    it('should return 404 if request not found', async () => {
      OwnershipRequest.getById.mockResolvedValue(null);

      const req = { params: { id: 999 }, body: { status: 'approved' } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await OwnershipController.updateRequestStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Request not found' });
    });

    it('should approve request with existing store_id', async () => {
      const mockRequest = {
        id: 1,
        user_id: 1,
        store_name: 'Existing Store',
        store_address: '456 Test Ave'
      };
      OwnershipRequest.getById.mockResolvedValue(mockRequest);
      OwnershipRequest.updateStatus.mockResolvedValue(true);

      const req = { 
        params: { id: 1 }, 
        body: { status: 'approved', store_id: 71 }
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await OwnershipController.updateRequestStatus(req, res);

      // Should update user role to owner
      expect(db.execute).toHaveBeenCalledWith(
        "UPDATE users SET role = 'owner' WHERE id = ?",
        [1]
      );
      
      // Should update store owner_id
      expect(db.execute).toHaveBeenCalledWith(
        "UPDATE stores SET owner_id = ? WHERE id = ?",
        [1, 71]
      );
      
      expect(res.json).toHaveBeenCalledWith({
        message: 'Request approved successfully and user promoted to owner'
      });
    });

    it('should reject request', async () => {
      const mockRequest = { id: 1, user_id: 1 };
      OwnershipRequest.getById.mockResolvedValue(mockRequest);
      OwnershipRequest.updateStatus.mockResolvedValue(true);

      const req = { 
        params: { id: 1 }, 
        body: { status: 'rejected', admin_notes: 'Not eligible' }
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await OwnershipController.updateRequestStatus(req, res);

      expect(OwnershipRequest.updateStatus).toHaveBeenCalledWith(1, 'rejected', 'Not eligible');
      expect(res.json).toHaveBeenCalledWith({
        message: 'Request rejected successfully and user promoted to owner'
      });
    });

    it('should return 404 if update fails', async () => {
      const mockRequest = { id: 1, user_id: 1 };
      OwnershipRequest.getById.mockResolvedValue(mockRequest);
      OwnershipRequest.updateStatus.mockResolvedValue(false);

      const req = { 
        params: { id: 1 }, 
        body: { status: 'approved' }
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await OwnershipController.updateRequestStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update request' });
    });
  });
});