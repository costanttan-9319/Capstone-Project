import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// ==================== MOCK SETUP ====================
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
    currentDay: 'Saturday',
    currentHour: 14,
    currentMinute: 0,
    getStoreStatus: vi.fn(() => 'Open'),
    getDisplayDay: vi.fn(() => 'Saturday'),
  }),
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  
  localStorage.setItem('token', 'fake-admin-token');
  localStorage.setItem('user', JSON.stringify({ id: 1, username: 'admin', role: 'admin' }));
});

describe('Admin Delete Store', () => {

  test('admin can delete a store', async () => {
    const mockStoreData = {
      tier_1_within_1km: [
        {
          id: 42,
          name: 'Songhua River Dragon Banquet House Restaurant',
          cuisine: 'Chinese',
          distance_km: 0.6,
          rating: 4.3,
          price_range: '$$',
          description: 'Authentic Chinese banquet restaurant',
          opening_hours: {
            Monday: '11:00 AM - 10:00 PM',
            Tuesday: '11:00 AM - 10:00 PM',
            Wednesday: '11:00 AM - 10:00 PM',
            Thursday: '11:00 AM - 10:00 PM',
            Friday: '11:00 AM - 10:00 PM',
            Saturday: '10:00 AM - 11:00 PM',
            Sunday: '10:00 AM - 9:00 PM',
          },
          image_path: 'https://example.com/songhua.jpg',
          special_status: '',
          is_top_pick: true,
        },
      ],
      tier_2_within_2km: [],
      tier_3_beyond_2km: [],
    };

    const api = (await import('../services/api')).default;
    api.get.mockResolvedValue({ data: mockStoreData });
    
    // Mock the delete API call
    api.delete.mockResolvedValue({ data: { message: 'Store deleted successfully' } });

    // Mock window.confirm to return true (user confirms deletion)
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    render(<App />);

    const locationInput = screen.getByPlaceholderText(/Type Your Location/i);
    fireEvent.change(locationInput, { target: { value: 'Singapore' } });

    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    const storeName = await screen.findByText(/Songhua River/i);
    expect(storeName).toBeInTheDocument();

    // Find and click delete button (red trash can icon)
    const deleteButton = document.querySelector('.admin-btn.delete');
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);

    // Verify confirm dialog was shown
    expect(window.confirm).toHaveBeenCalled();

    // Verify DELETE API was called
    expect(api.delete).toHaveBeenCalledWith('/stores/42');

    // Restore original confirm
    window.confirm = originalConfirm;
  });

});