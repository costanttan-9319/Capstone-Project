import { describe, it, expect, vi, beforeEach } from 'vitest';
import db from '../../config/db.js';
import { OwnershipRequest } from '../../models/ownershipRequestModel.js';

// Mock the models and db
vi.mock('../../models/ownershipRequestModel.js', () => ({
  OwnershipRequest: {
    getPendingRequests: vi.fn(),
    getById: vi.fn(),
  },
}));

// Create a mock connection with transaction methods
const createMockConnection = () => ({
  execute: vi.fn(),
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
});

vi.mock('../../config/db.js', () => ({
  default: {
    getConnection: vi.fn(),
    execute: vi.fn(),
  },
  pool: { execute: vi.fn() },
}));

// Import after mocks
import { AdminController } from '../../controllers/adminController.js';

describe('Admin Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== READ: Get Pending Requests ====================
  describe('getPendingRequests', () => {
    it('should return list of pending requests', async () => {
      const mockRequests = [{ id: 1, store_name: 'Test Store', status: 'pending' }];
      OwnershipRequest.getPendingRequests.mockResolvedValue(mockRequests);

      const req = {};
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AdminController.getPendingRequests(req, res);

      expect(OwnershipRequest.getPendingRequests).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    it('should handle errors', async () => {
      OwnershipRequest.getPendingRequests.mockRejectedValue(new Error('DB error'));

      const req = {};
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AdminController.getPendingRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
    });
  });

describe('approveRequest', () => {
  it('should reject request when status is "rejected"', async () => {
    const req = { params: { id: 1 }, body: { status: 'rejected' } };
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
    db.execute.mockResolvedValue([{ affectedRows: 1 }]);

    await AdminController.approveRequest(req, res);

    expect(db.execute).toHaveBeenCalledWith(
      'DELETE FROM ownership_requests WHERE id = ?',
      [1]
    );
    expect(res.json).toHaveBeenCalledWith({ message: 'Request rejected and deleted' });
  });

  it('should return 400 if store_id is missing for approval', async () => {
    // Mock the request existence to avoid 404
    OwnershipRequest.getById.mockResolvedValue({ id: 1, user_id: 5, store_name: 'Test Store' });

    const req = { params: { id: 1 }, body: { status: 'approved' } };
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    await AdminController.approveRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No Store ID provided for approval' });
  });

  it('should return 404 if request not found', async () => {
    OwnershipRequest.getById.mockResolvedValue(null);
    const req = { params: { id: 999 }, body: { status: 'approved', store_id: 10 } };
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    await AdminController.approveRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Request not found' });
  });

  it('should return 400 if store_id does not exist', async () => {
    const mockRequest = { id: 1, user_id: 5, store_name: 'Test' };
    OwnershipRequest.getById.mockResolvedValue(mockRequest);
    const mockConnection = createMockConnection();
    db.getConnection.mockResolvedValue(mockConnection);
    // Simulate store check returning empty
    mockConnection.execute.mockResolvedValueOnce([[]]);

    const req = { params: { id: 1 }, body: { status: 'approved', store_id: 999 } };
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    await AdminController.approveRequest(req, res);

    expect(mockConnection.execute).toHaveBeenCalledWith(
      'SELECT id, name FROM stores WHERE id = ?',
      [999]
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Store ID does not exist' });
    expect(mockConnection.release).toHaveBeenCalled();
  });

  it('should approve request and set user as primary owner if store has no owner', async () => {
    const mockRequest = { id: 1, user_id: 5, store_name: 'Test Store' };
    OwnershipRequest.getById.mockResolvedValue(mockRequest);
    const mockConnection = createMockConnection();
    db.getConnection.mockResolvedValue(mockConnection);

    // Mock store check – store exists
    mockConnection.execute.mockResolvedValueOnce([[{ id: 10, name: 'Store' }]]);
    mockConnection.beginTransaction.mockResolvedValue();
    mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE users
    mockConnection.execute.mockResolvedValueOnce([[{ owner_id: null }]]); // SELECT owner_id
    mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE stores.owner_id
    mockConnection.execute.mockResolvedValueOnce([[]]); // SELECT from store_owners
    mockConnection.execute.mockResolvedValueOnce([{ insertId: 99 }]); // INSERT store_owners
    mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE requests
    mockConnection.commit.mockResolvedValue();

    const req = { params: { id: 1 }, body: { status: 'approved', store_id: 10 } };
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    await AdminController.approveRequest(req, res);

    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.execute).toHaveBeenCalledWith(
      'UPDATE users SET role = \'owner\' WHERE id = ?',
      [5]
    );
    expect(mockConnection.execute).toHaveBeenCalledWith(
      'UPDATE stores SET owner_id = ? WHERE id = ?',
      [5, 10]
    );
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: 'One-Click Approval successful',
      store_id: 10,
    });
  });

  it('should approve request as co-owner if store already has primary owner', async () => {
    const mockRequest = { id: 1, user_id: 6, store_name: 'Test Store' };
    OwnershipRequest.getById.mockResolvedValue(mockRequest);
    const mockConnection = createMockConnection();
    db.getConnection.mockResolvedValue(mockConnection);

    mockConnection.execute.mockResolvedValueOnce([[{ id: 10, name: 'Store' }]]);
    mockConnection.beginTransaction.mockResolvedValue();
    mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE users
    mockConnection.execute.mockResolvedValueOnce([[{ owner_id: 3 }]]); // store already has owner
    // No UPDATE stores.owner_id call expected
    mockConnection.execute.mockResolvedValueOnce([[]]); // SELECT from store_owners
    mockConnection.execute.mockResolvedValueOnce([{ insertId: 100 }]); // INSERT store_owners
    mockConnection.execute.mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE requests
    mockConnection.commit.mockResolvedValue();

    const req = { params: { id: 1 }, body: { status: 'approved', store_id: 10 } };
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    await AdminController.approveRequest(req, res);

    const storeOwnerUpdateCalls = mockConnection.execute.mock.calls.filter(
      call => call[0] === 'UPDATE stores SET owner_id = ? WHERE id = ?'
    );
    expect(storeOwnerUpdateCalls.length).toBe(0);
    expect(mockConnection.execute).toHaveBeenCalledWith(
      `INSERT INTO store_owners (user_id, store_id, is_approved, approved_at) 
           VALUES (?, ?, TRUE, NOW())`,
      [6, 10]
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'One-Click Approval successful',
      store_id: 10,
    });
  });

  it('should rollback transaction on error', async () => {
    const mockRequest = { id: 1, user_id: 5, store_name: 'Test Store' };
    OwnershipRequest.getById.mockResolvedValue(mockRequest);
    const mockConnection = createMockConnection();
    db.getConnection.mockResolvedValue(mockConnection);

    mockConnection.execute.mockResolvedValueOnce([[{ id: 10, name: 'Store' }]]);
    mockConnection.beginTransaction.mockResolvedValue();
    // Simulate error during user update
    mockConnection.execute.mockRejectedValueOnce(new Error('DB failure'));

    const req = { params: { id: 1 }, body: { status: 'approved', store_id: 10 } };
    const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    await AdminController.approveRequest(req, res);

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Database transaction failed' });
    expect(mockConnection.release).toHaveBeenCalled();
  });
});

  // ==================== UPDATE: Reject Request (simple) ====================
  describe('rejectRequest', () => {
    it('should update request status to rejected', async () => {
      const req = { params: { id: 1 } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
      db.execute.mockResolvedValue([{ affectedRows: 1 }]);

      await AdminController.rejectRequest(req, res);

      expect(db.execute).toHaveBeenCalledWith(
        'UPDATE ownership_requests SET status = "rejected" WHERE id = ?',
        [1]
      );
      expect(res.json).toHaveBeenCalledWith({ message: 'Request rejected successfully' });
    });

    it('should handle errors', async () => {
      db.execute.mockRejectedValue(new Error('DB error'));

      const req = { params: { id: 1 } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await AdminController.rejectRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
    });
  });
});