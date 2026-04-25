// Mock version of MyStore component for testing
import React from 'react';

const MockMyStore = () => {
  return (
    <div className="favourite-container">
      <h1 className="favourite-title">My Store</h1>
      
      <div style={{ marginBottom: "2rem" }}>
        <button
          className="submit-request-btn"
          data-testid="add-my-store-button"
        >
          <span style={{ marginRight: "8px" }}>+</span> Add My Store
        </button>
      </div>

      <p className="no-favourites">You don't own any stores yet.</p>
      
      {/* Mock modal that shows when button is clicked */}
      <div data-testid="request-modal" style={{ display: 'none' }}>
        <h2>Request Store Ownership</h2>
        <form data-testid="request-form">
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
    </div>
  );
};

export default MockMyStore;