import React, { useEffect, useState } from "react";
import api from "../services/api";
import useAuth from "../hooks/useAuth";
import LoginCard from "../components/LoginCard";

// ==================== ADMIN REQUESTS PAGE ====================
const AdminRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeOptions, setStoreOptions] = useState([]);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [storeIdMap, setStoreIdMap] = useState({});
  const [activeRequestId, setActiveRequestId] = useState(null);

  // ==================== FETCH PENDING REQUESTS ====================
  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const fetchRequests = async () => {
      try {
        const response = await api.get("/ownership/pending");
        console.log("🔵 [AdminRequests] Full response:", response);
        console.log("🔵 [AdminRequests] response.data:", response.data);
        console.log("🔵 [AdminRequests] Is array?", Array.isArray(response.data));
        
        let requestsData = [];
        if (Array.isArray(response.data)) {
          requestsData = response.data;
        } else if (response.data && Array.isArray(response.data.requests)) {
          requestsData = response.data.requests;
        } else if (response.data && Array.isArray(response.data.data)) {
          requestsData = response.data.data;
        } else {
          console.log("🔴 [AdminRequests] Unexpected response format:", response.data);
          requestsData = [];
        }
        
        console.log("🔵 [AdminRequests] Extracted requests:", requestsData.length);
        setRequests(requestsData);
      } catch (error) {
        console.error("🔴 Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [user]);

  // ==================== FETCH ALL STORES FOR DROPDOWN ====================
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await api.get("/stores/all");
        console.log("Stores fetched:", response.data);  
        setStoreOptions(response.data);
      } catch (error) {
        console.error("Error fetching stores:", error);
      }
    };
    fetchStores();
  }, []);

  // ==================== NOT ADMIN ====================
  if (!user) {
    return (
      <div className="login-container">
        <LoginCard />
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="unauthorized-container">
        <h1>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  // ==================== SET SELECTED STORE FOR REQUEST ====================
  const setSelectedStoreForRequest = (requestId, storeId, storeName) => {
    console.log("🔵 [setSelectedStoreForRequest] Request:", requestId, "Store ID:", storeId, "Store Name:", storeName);
    setStoreIdMap(prev => ({ ...prev, [requestId]: storeId }));
    setSearchTerm(storeName);
    setActiveRequestId(null);
    setShowStoreDropdown(false);
  };

  // ==================== HANDLE APPROVE ====================
  const handleApprove = async (requestId) => {
    console.log("🔵 [handleApprove] Called for request ID:", requestId);
    console.log("🔵 [handleApprove] Current storeIdMap:", storeIdMap);
    console.log("🔵 [handleApprove] activeRequestId:", activeRequestId);
    console.log("🔵 [handleApprove] searchTerm:", searchTerm);
    
    setActionLoading(requestId);
    
    let finalStoreId = storeIdMap[requestId];
    console.log("🔵 [handleApprove] finalStoreId from map:", finalStoreId);
    
    if (!finalStoreId && activeRequestId === requestId && searchTerm) {
      const manualId = parseInt(searchTerm);
      console.log("🔵 [handleApprove] manualId from searchTerm:", manualId);
      if (!isNaN(manualId)) {
        finalStoreId = manualId;
        console.log("🔵 [handleApprove] Using manual ID:", finalStoreId);
      }
    }

    console.log("🔵 [handleApprove] FINAL store_id to send:", finalStoreId);

    try {
      const payload = {
        status: "approved",
        store_id: finalStoreId || null,
        admin_notes: null,
      };
      console.log("🔵 [handleApprove] Sending payload:", payload);
      
      await api.put(`/ownership/${requestId}/status`, payload);
      console.log("✅ [handleApprove] Request approved successfully");
      setRequests(requests.filter((r) => r.id !== requestId));
      alert("Request approved successfully!");
    } catch (error) {
      console.error("🔴 Error approving request:", error);
      alert("Failed to approve request");
    } finally {
      setActionLoading(null);
    }
  };

  // ==================== HANDLE REJECT ====================
  const handleReject = async () => {
    if (!selectedRequest) return;

    setActionLoading(selectedRequest.id);
    try {
      await api.put(`/ownership/${selectedRequest.id}/status`, {
        status: "rejected",
        admin_notes: rejectReason,
      });
      setRequests(requests.filter((r) => r.id !== selectedRequest.id));
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedRequest(null);
      alert("Request rejected successfully!");
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request");
    } finally {
      setActionLoading(null);
    }
  };

  // ==================== OPEN REJECT MODAL ====================
  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  // ==================== VIEW REQUEST DETAILS ====================
  const viewDetails = (request) => {
    setSelectedRequest(request);
  };

  // ==================== CLOSE DETAILS ====================
  const closeDetails = () => {
    setSelectedRequest(null);
  };

  // ==================== FILTERED STORES ====================
  const filteredStores = storeOptions.filter(store =>
    store.id.toString().includes(searchTerm)  
  );

  // ==================== LOADING ====================
  if (loading) {
    return <div className="loading-container">Loading requests...</div>;
  }

  // ==================== RENDER ====================
  return (
    <div className="admin-requests-container">
      <h1 className="admin-requests-title">Store Ownership Requests</h1>

      {requests.length === 0 ? (
        <p className="no-requests">No pending requests.</p>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <h3>{request.username}</h3>
                <span className="request-status pending">Pending</span>
              </div>
              <div className="request-info">
                <p><strong>Email:</strong> {request.email}</p>
                <p><strong>Contact:</strong> {request.contact_number}</p>
                <p><strong>Store Name:</strong> {request.store_name}</p>
                <p><strong>Store Address:</strong> {request.store_address}</p>
                <p><strong>ID Type:</strong> {request.id_type === "passport" ? "Passport" : "ID / Driver's License"}</p>
                <p><strong>Submitted:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
              </div>

              {/* Store Selection Dropdown */}
              <div className="store-selection">
                <label>Link to existing store (optional):</label>
                <div className="search-dropdown">
                  <input
                    type="text"
                    placeholder="Search store by Store ID..."
                    value={activeRequestId === request.id ? searchTerm : storeIdMap[request.id] ? storeOptions.find(s => s.id === storeIdMap[request.id])?.name || "" : ""}
                    onFocus={() => {
                      setActiveRequestId(request.id);
                      setSearchTerm("");
                      setShowStoreDropdown(true);
                    }}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="store-search-input"
                  />
                  {showStoreDropdown && activeRequestId === request.id && (
                    <div className="dropdown-list">
                      {filteredStores.length === 0 ? (
                        <div className="dropdown-item no-results">No stores found</div>
                      ) : (
                        filteredStores.map(store => (
                          <div
                            key={store.id}
                            className="dropdown-item"
                            onClick={() => setSelectedStoreForRequest(request.id, store.id, store.name)}
                          >
                            ID: {store.id} - {store.name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="request-actions">
                <button className="view-btn" onClick={() => viewDetails(request)}>View Documents</button>
                <button 
                  className="approve-btn" 
                  onClick={() => handleApprove(request.id)}
                  disabled={actionLoading === request.id}
                >
                  {actionLoading === request.id ? "Processing..." : "Approve"}
                </button>
                <button 
                  className="reject-btn" 
                  onClick={() => openRejectModal(request)}
                  disabled={actionLoading === request.id}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
   {/* Details Modal */}
      {selectedRequest && !showRejectModal && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal-card request-details-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeDetails}>×</button>
            <h2>Request Details</h2>
            <div className="details-section">
              <h3>User Information</h3>
              <p><strong>Username:</strong> {selectedRequest.username}</p>
              <p><strong>Email:</strong> {selectedRequest.email}</p>
              <p><strong>Contact:</strong> {selectedRequest.contact_number}</p>
            </div>

            <div className="details-section">
              <h3>Identification Documents</h3>
              {selectedRequest.id_type === "passport" ? (
                <div className="image-container">
                  <p>Passport:</p>
                  <img src={selectedRequest.passport_image} alt="Passport" className="document-image" />
                </div>
              ) : (
                <div className="image-container">
                  <div>
                    <p>ID Front:</p>
                    <img src={selectedRequest.id_front_image} alt="ID Front" className="document-image" />
                  </div>
                  <div>
                    <p>ID Back:</p>
                    <img src={selectedRequest.id_back_image} alt="ID Back" className="document-image" />
                  </div>
                </div>
              )}
            </div>

            <div className="details-section">
              <h3>Proof of Ownership (ACRA)</h3>
              <div className="image-container">
                <img src={selectedRequest.acra_image} alt="ACRA Document" className="document-image" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowRejectModal(false)}>×</button>
            <h2>Reject Request</h2>
            <p>Are you sure you want to reject {selectedRequest.username}'s request?</p>
            <div className="form-group">
              <label>Reason (Optional)</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="reject-btn" onClick={handleReject} disabled={actionLoading === selectedRequest.id}>
                {actionLoading === selectedRequest.id ? "Processing..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequests;