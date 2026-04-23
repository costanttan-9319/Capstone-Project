import React, { useEffect, useState } from "react";
import api from "../services/api";
import useAuth from "../hooks/useAuth";
import LoginCard from "../components/LoginCard";
import StoreCard from "../components/StoreCard";
import EditStoreModal from "../components/EditStoreModal";

// ==================== MY STORE PAGE ====================
const MyStore = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [idType, setIdType] = useState("passport");
  const [isDirty, setIsDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // ==================== EDIT MODAL STATES ====================
  const [editingStore, setEditingStore] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    contact_number: "",
    store_name: "",
    store_address: "",
    passport_image: null,
    id_front_image: null,
    id_back_image: null,
    acra_image: null
  });

  // ==================== FETCH USER'S STORES ====================
  useEffect(() => {
    if (!user) return;

    const fetchMyStores = async () => {
      try {
        const response = await api.get("/users/my-stores");
        setStores(response.data);
      } catch (error) {
        console.error("Error fetching my stores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyStores();

    // Pre-fill user data
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  // ==================== HANDLE EDIT ====================
  const handleEditClick = (store) => {
    setEditingStore(store);
    setIsEditModalOpen(true);
  };

  // ==================== HANDLE DELETE SUCCESS ====================
  const handleDeleteSuccess = (storeId) => {
    setStores(stores.filter(store => store.id !== storeId));
  };

  // ==================== HANDLE INPUT CHANGE ====================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  // ==================== HANDLE FILE UPLOAD ====================
  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [fieldName]: reader.result }));
        setIsDirty(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // ==================== HANDLE CLOSE MODAL ====================
  const handleCloseModal = () => {
    if (isDirty) {
      const confirmClose = window.confirm("You have unsaved changes. Are you sure you want to exit?");
      if (!confirmClose) return;
    }
    setShowRequestModal(false);
    setIsDirty(false);
    setError("");
    setSuccess("");
    // Reset form
    setFormData({
      username: user?.username || "",
      email: user?.email || "",
      contact_number: "",
      store_name: "",
      store_address: "",
      passport_image: null,
      id_front_image: null,
      id_back_image: null,
      acra_image: null
    });
    setIdType("passport");
  };

  // ==================== HANDLE SUBMIT ====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    // Validation
    if (!formData.username || !formData.store_name || !formData.store_address || !formData.email || !formData.contact_number) {
      setError("Please fill in all required fields");
      setSubmitting(false);
      return;
    }

    if (idType === "passport" && !formData.passport_image) {
      setError("Please upload your passport image");
      setSubmitting(false);
      return;
    }

    if (idType === "id_card" && (!formData.id_front_image || !formData.id_back_image)) {
      setError("Please upload both front and back of your ID");
      setSubmitting(false);
      return;
    }

    if (!formData.acra_image) {
      setError("Please upload proof of store ownership (ACRA)");
      setSubmitting(false);
      return;
    }

    try {
      await api.post("/ownership/request", {
        username: formData.username,
        email: formData.email,
        contact_number: formData.contact_number,
        store_name: formData.store_name,
        store_address: formData.store_address,
        id_type: idType,
        passport_image: formData.passport_image,
        id_front_image: formData.id_front_image,
        id_back_image: formData.id_back_image,
        acra_image: formData.acra_image
      });

      setSuccess("Request submitted successfully!");
      
      // SURGERY START: Reset dirty flag so the confirm box doesn't pop up on success
      setIsDirty(false); 

      // Wait 1.5 seconds so user sees the success message, then close and refresh
      setTimeout(() => {
        setShowRequestModal(false);
        // If you just want to refresh the store list without a full page flicker:
        // fetchMyStores(); 
        // But if you prefer a full refresh:
        window.location.reload();
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit request");
      setSubmitting(false);
    }
  };

  // ==================== NOT LOGGED IN ====================
  if (!user) {
    return (
      <div className="login-container">
        <LoginCard />
      </div>
    );
  }

  // ==================== LOADING ====================
  if (loading) {
    return <div className="loading-container">Loading your stores...</div>;
  }

  // ==================== RENDER ====================
  return (
    <div className="favourite-container">
      <h1 className="favourite-title">My Store</h1>

      {/* Add My Store Button */}
      <div style={{ marginBottom: "2rem" }}>
        <button
          className="submit-request-btn"
          onClick={() => setShowRequestModal(true)}
        >
          <span style={{ marginRight: "8px" }}>+</span> Add My Store
        </button>
      </div>

      {stores.length === 0 ? (
        <p className="no-favourites">You don't own any stores yet.</p>
      ) : (
        <div className="store-grid">
          {stores.map((store) => (
            <StoreCard 
              key={store.id} 
              store={store} 
              onEdit={handleEditClick}
              onDelete={handleDeleteSuccess}
            />
          ))}
        </div>
      )}

      {/* ==================== EDIT STORE MODAL ==================== */}
      <EditStoreModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        store={editingStore}
        onSuccess={() => {
          setIsEditModalOpen(false);
          window.location.reload();
        }}
      />

      {/* ==================== REQUEST OWNERSHIP MODAL ==================== */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="request-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseModal}>×</button>
            
            <h2 className="login-title">Request Store Ownership</h2>
            <p className="login-subtitle">Submit your details for verification.</p>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form className="request-form" onChange={() => setIsDirty(true)} onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username *</label>
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter username" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Contact Number *</label>
                <input 
                  type="text" 
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  placeholder="e.g. +65 9123 4567" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Store Name *</label>
                <input 
                  type="text" 
                  name="store_name"
                  value={formData.store_name}
                  onChange={handleInputChange}
                  placeholder="Enter store name" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Store Address *</label>
                <input 
                  type="text" 
                  name="store_address"
                  value={formData.store_address}
                  onChange={handleInputChange}
                  placeholder="Enter store address" 
                  required 
                />
              </div>

              {/* Proof of Identification Section */}
              <div className="form-group">
                <label>Proof of Identification *</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="idType" 
                      value="passport" 
                      onChange={(e) => setIdType(e.target.value)}
                      defaultChecked 
                    /> Passport
                  </label>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="idType" 
                      value="id_card" 
                      onChange={(e) => setIdType(e.target.value)} 
                    /> ID / Driver's License
                  </label>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  {idType === 'passport' ? (
                    <div className="image-upload-box">
                      <p>Drop Passport Image Here *</p>
                      <input 
                        type="file" 
                        className="file-input" 
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'passport_image')}
                      />
                      {formData.passport_image && <p className="upload-success">✓ Image uploaded</p>}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div className="image-upload-box" style={{ flex: 1 }}>
                        <p>ID Front *</p>
                        <input 
                          type="file" 
                          className="file-input" 
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'id_front_image')}
                        />
                        {formData.id_front_image && <p className="upload-success">✓ Uploaded</p>}
                      </div>
                      <div className="image-upload-box" style={{ flex: 1 }}>
                        <p>ID Back *</p>
                        <input 
                          type="file" 
                          className="file-input" 
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'id_back_image')}
                        />
                        {formData.id_back_image && <p className="upload-success">✓ Uploaded</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Proof of Store Ownership */}
              <div className="form-group">
                <label>Proof of Store Ownership (ACRA) *</label>
                <div className="image-upload-box">
                  <p>Upload ACRA / Business Proof *</p>
                  <input 
                    type="file" 
                    className="file-input" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'acra_image')}
                  />
                  {formData.acra_image && <p className="upload-success">✓ Image uploaded</p>}
                </div>
              </div>

              <button type="submit" className="submit-request-btn" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyStore;