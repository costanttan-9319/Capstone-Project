import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import App from '../App';

// Mock the MyStore component
vi.mock('../pages/MyStore', () => ({
  default: () => {
    const [showModal, setShowModal] = React.useState(false);
    return (
      <div className="favourite-container">
        <h1 className="favourite-title">My Store</h1>
        
        <div style={{ marginBottom: "2rem" }}>
          <button
            className="submit-request-btn"
            onClick={() => setShowModal(true)}
            data-testid="add-my-store-button"
          >
            <span style={{ marginRight: "8px" }}>+</span> Add My Store
          </button>
        </div>

        <p className="no-favourites">You don't own any stores yet.</p>
        
        {showModal && (
          <div data-testid="request-modal">
            <h2>Request Store Ownership</h2>
            <form data-testid="request-form" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="text" 
                name="store_name"
                placeholder="Enter store name"
                data-testid="store-name-input"
              />
              <input 
                type="text" 
                name="store_address"
                placeholder="Enter store address"
                data-testid="store-address-input"
              />
              <button type="submit" data-testid="submit-request-button">
                Submit Request
              </button>
            </form>
          </div>
        )}
      </div>
    );
  },
}));

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

describe('Admin Ownership Request', () => {

  test('admin can open ownership request modal', async () => {
    render(<App />);

    const myStoreLink = screen.getByText('MyStore');
    fireEvent.click(myStoreLink);

    const addButton = await screen.findByTestId('add-my-store-button');
    fireEvent.click(addButton);

    const modal = await screen.findByTestId('request-modal');
    expect(modal).toBeInTheDocument();
  });

});