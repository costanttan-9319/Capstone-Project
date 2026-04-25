import { vi } from 'vitest';

// Mock the database pool
export const mockPool = {
  query: vi.fn(),
  getConnection: vi.fn(),
  end: vi.fn(),
};

// Mock the pool's getConnection to return a connection with query
mockPool.getConnection.mockResolvedValue({
  query: vi.fn(),
  release: vi.fn(),
});

// Helper to reset mocks between tests
export const resetMocks = () => {
  vi.clearAllMocks();
};