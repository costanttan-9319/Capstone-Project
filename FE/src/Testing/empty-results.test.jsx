import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    user: null,
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
    getStoreStatus: vi.fn(() => 'Closed'),
    getDisplayDay: vi.fn(() => 'Saturday'),
  }),
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('Empty Search Results', () => {

  test('shows "No stores found" when search returns empty', async () => {
    const api = (await import('../services/api')).default;
    
    api.get.mockResolvedValue({ 
      data: {
        tier_1_within_1km: [],
        tier_2_within_2km: [],
        tier_3_beyond_2km: [],
      }
    });

    render(<App />);

    const locationInput = screen.getByPlaceholderText(/Type Your Location/i);
    fireEvent.change(locationInput, { target: { value: 'Mars' } });

    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    const noResultsMessage = await screen.findByText(/No stores found/i);
    expect(noResultsMessage).toBeInTheDocument();
  });

});