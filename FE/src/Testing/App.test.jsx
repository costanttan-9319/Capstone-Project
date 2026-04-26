import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

// ==================== MOCK SETUP ====================
// Mock API
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock useAuth
vi.mock('../hooks/useAuth', () => ({
  default: () => ({
    user: { id: 1, username: 'testuser', role: 'user' },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

// Mock useTime
vi.mock('../hooks/useTime', () => ({
  default: () => ({
    currentDay: 'Saturday',
    currentHour: 1,
    currentMinute: 0,
    getStoreStatus: vi.fn(() => 'Open'),
    getDisplayDay: vi.fn(() => 'Friday'),
  }),
}));

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  
  localStorage.setItem('token', 'fake-test-token');
  localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser', role: 'user' }));
});

// ==================== TEST SUITE ====================
describe('EatWhere App', () => {

  // ========= Test 1: App renders without crashing (Smoke Test) =========
  test('renders without crashing', () => {
    render(<App />);
    expect(true).toBe(true);
  });

  // ========= Test 2: Search by location displays store cards =========
  test('search by location displays store cards', async () => {
    const mockStoreData = {
      tier_1_within_1km: [
        {
          id: 1,
          name: 'Test Pizza Place',
          cuisine: 'Italian',
          distance_km: 0.5,
          rating: 4.5,
          price_range: '$10-20',
          opening_hours: { Monday: '11:00 AM - 10:00 PM' },
          image_path: 'https://example.com/pizza.jpg',
          special_status: null,
        },
      ],
      tier_2_within_2km: [],
      tier_3_beyond_2km: [],
    };

    const api = (await import('../services/api')).default;
    api.get.mockResolvedValue({ data: mockStoreData });

    render(<App />);

    const locationInput = screen.getByPlaceholderText(/Type Your Location/i);
    fireEvent.change(locationInput, { target: { value: 'Singapore' } });

    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    const storeName = await screen.findByText(/Test Pizza Place/i);
    expect(storeName).toBeInTheDocument();
    expect(screen.getByText(/Italian/i)).toBeInTheDocument();
  });

  // ========= Test 3: Store card displays store name =========
  test('store card displays store name after search', async () => {
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
          opening_hours: { Monday: '11:00 AM - 10:00 PM' },
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

    render(<App />);

    const locationInput = screen.getByPlaceholderText(/Type Your Location/i);
    fireEvent.change(locationInput, { target: { value: 'Singapore' } });

    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    const storeName = await screen.findByText(/Songhua River/i);
    expect(storeName).toBeInTheDocument();
  });

  // ========= Test 4: User can favorite a store =========
  test('user can favorite a store', async () => {
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
          opening_hours: { Monday: '11:00 AM - 10:00 PM' },
          image_path: 'https://example.com/songhua.jpg',
          special_status: '',
          is_top_pick: true,
        },
      ],
      tier_2_within_2km: [],
      tier_3_beyond_2km: [],
    };

    const api = (await import('../services/api')).default;
    
    api.get.mockReset();
    api.get.mockImplementation((url) => {
      if (url === '/stores/42/favourite/check') {
        return Promise.resolve({ data: { isFavourited: false } });
      }
      return Promise.resolve({ data: mockStoreData });
    });
    
    api.post.mockResolvedValue({ data: { message: 'Added to favorites' } });

    render(<App />);

    const locationInput = screen.getByPlaceholderText(/Type Your Location/i);
    fireEvent.change(locationInput, { target: { value: 'Singapore' } });

    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    const storeName = await screen.findByText(/Songhua River/i, {}, { timeout: 3000 });
    expect(storeName).toBeInTheDocument();

    const favoriteButton = document.querySelector('.heart-toggle');
    expect(favoriteButton).toBeInTheDocument();
    fireEvent.click(favoriteButton);

    expect(api.post).toHaveBeenCalledWith('/stores/42/favourite');
  });

  // ========= Test 5: Try Me random pick =========
  test('try me button returns random store', async () => {
    const mockRandomStore = {
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
      },
      image_path: 'https://example.com/songhua.jpg',
      special_status: '',
      is_top_pick: true,
    };

    const api = (await import('../services/api')).default;
    api.get.mockResolvedValue({ data: { selected_store: mockRandomStore } });

    render(<App />);

    const locationInput = screen.getByPlaceholderText(/Type Your Location/i);
    fireEvent.change(locationInput, { target: { value: 'Singapore' } });

    const tryMeButton = screen.getByText('TRY ME');
    fireEvent.click(tryMeButton);

    const storeName = await screen.findByText(/Songhua River/i);
    expect(storeName).toBeInTheDocument();
  });

  // ========= Test 6: Overnight hours show correct bold day at 1am =========
  test('overnight hours show correct bold day at 1am', async () => {
    const mockStoreWithOvernight = {
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
        Friday: '9:00 AM - 3:00 AM',
        Saturday: '10:00 AM - 11:00 PM',
        Sunday: '10:00 AM - 9:00 PM',
      },
      image_path: 'https://example.com/songhua.jpg',
      special_status: '',
      is_top_pick: true,
    };

    const api = (await import('../services/api')).default;
    api.get.mockResolvedValue({ 
      data: {
        tier_1_within_1km: [mockStoreWithOvernight],
        tier_2_within_2km: [],
        tier_3_beyond_2km: [],
      }
    });

    render(<App />);

    const locationInput = screen.getByPlaceholderText(/Type Your Location/i);
    fireEvent.change(locationInput, { target: { value: 'Singapore' } });

    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    const storeName = await screen.findByText(/Songhua River/i);
    expect(storeName).toBeInTheDocument();

    const fridayRow = screen.getByText(/Friday/i).closest('.hours-row');
    expect(fridayRow).toHaveClass('is-today');
    
    const saturdayRow = screen.getByText(/Saturday/i).closest('.hours-row');
    expect(saturdayRow).not.toHaveClass('is-today');
  });

});