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

// Mock useAuth - OWNER user (id matches store.owner_id)
vi.mock('../hooks/useAuth', () => ({
  default: () => ({
    user: { id: 42, username: 'owner', role: 'user' },
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
  
  localStorage.setItem('token', 'fake-owner-token');
  localStorage.setItem('user', JSON.stringify({ id: 42, username: 'owner', role: 'user' }));
});

describe('Owner Edit Store', () => {

  test('owner can edit their own store', async () => {
    // Mock store with owner_id = 42 (matches logged-in user)
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
          owner_id: 42,  // Important: matches user.id
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
    api.put.mockResolvedValue({ data: { message: 'Store updated successfully' } });

    render(<App />);

    const locationInput = screen.getByPlaceholderText(/Type Your Location/i);
    fireEvent.change(locationInput, { target: { value: 'Singapore' } });

    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    const storeName = await screen.findByText(/Songhua River/i);
    expect(storeName).toBeInTheDocument();

    // Owner should see edit button (isOwner = true)
    const editButton = document.querySelector('.admin-btn.edit');
    expect(editButton).toBeInTheDocument();
    fireEvent.click(editButton);

    const modalTitle = await screen.findByText('Edit Store Details');
    expect(modalTitle).toBeInTheDocument();

    // Find description field and update it
    const descriptionField = document.querySelector('textarea[name="description"]');
    expect(descriptionField).toBeInTheDocument();
    fireEvent.change(descriptionField, { target: { value: 'Updated by OWNER test - My restaurant!' } });

    const saveButton = screen.getByText('Save All Changes');
    fireEvent.click(saveButton);

    // Verify PUT request was made
    expect(api.put).toHaveBeenCalledWith('/stores/42', expect.objectContaining({
      description: 'Updated by OWNER test - My restaurant!'
    }));
  });

});