import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../hooks/useAuth', () => ({
  default: () => ({
    user: { id: 1, username: 'admin', role: 'admin' },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

vi.mock('../hooks/useTime', () => ({
  default: () => ({
    currentDay: 'Monday',
    currentHour: 14,
    currentMinute: 0,
    getStoreStatus: vi.fn(() => 'Open'),
    getDisplayDay: vi.fn(() => 'Monday'),
  }),
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  
  localStorage.setItem('token', 'fake-admin-token');
  localStorage.setItem('user', JSON.stringify({ id: 1, username: 'admin', role: 'admin' }));
});

describe('Admin Approve Ownership Request', () => {

  test('admin can approve ownership request by typing store ID', async () => {
    const api = (await import('../services/api')).default;
    
    // Mock pending requests
    api.get.mockResolvedValue({ 
      data: [
        { 
          id: 1, 
          username: 'testuser',
          email: 'test@example.com',
          contact_number: '91234567',
          store_name: 'Pending Restaurant',
          store_address: '123 Test St',
          id_type: 'passport',
          passport_image: 'data:image...',
          created_at: '2024-01-01',
          status: 'pending'
        }
      ] 
    });
    
    // Mock approve API
    api.put.mockResolvedValue({ data: { message: 'Request approved' } });

    render(<App />);

    // Navigate to Admin page
    const adminLink = screen.getByText('Admin');
    fireEvent.click(adminLink);

    // Wait for request to appear
    await screen.findByText(/Pending Restaurant/i);

    // Find the search input
    const searchInput = screen.getByPlaceholderText(/Search store by Store ID/i);
    
    // Trigger focus to set activeRequestId
    fireEvent.focus(searchInput);
    
    // Now type the store ID
    fireEvent.change(searchInput, { target: { value: '42' } });

    // Click Approve button
    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);

    // Verify API was called with correct payload
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/ownership/1/status', {
        status: 'approved',
        store_id: 42,
        admin_notes: null
      });
    });
  });

});