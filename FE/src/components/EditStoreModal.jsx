import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";

// ==================== HELPER: TIME PICKER CONSTANTS ====================
const TIME_NUMBERS = [];
for (let h = 1; h <= 12; h++) {
  for (let m = 0; m < 60; m += 15) {
    const minuteStr = m.toString().padStart(2, '0');
    TIME_NUMBERS.push(`${h}:${minuteStr}`);
  }
}
const PERIODS = ["AM", "PM"];
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ==================== CUISINE LIST ====================
const CUISINE_OPTIONS = [
  "Chinese", "Local", "Muslim", "Halal", "Indian", "Western",
  "Fast Food", "Seafood", "Vegetarian", "Korean", "Japanese",
  "Vietnamese", "Mediterranean"
];

// ==================== CUSTOM SELECT WITH AUTO-SCROLL AND TYPING ====================
const CustomSelect = ({ value, options, onChange, disabled, width = "70px" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const selectedElement = menuRef.current.querySelector('.selected-option');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'center' });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const matchedOption = options.find(opt => opt === newValue);
    if (matchedOption) {
      onChange(matchedOption);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      const matchedOption = options.find(opt => opt.toLowerCase().includes(inputValue.toLowerCase()));
      if (matchedOption) {
        onChange(matchedOption);
        setInputValue(matchedOption);
      }
      setIsOpen(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const handleInputBlur = () => {
    if (!options.includes(inputValue)) {
      setInputValue(value);
    }
    setIsOpen(false);
  };

  return (
    <div
      className={`custom-select-container ${disabled ? 'disabled' : ''}`}
      style={{ width }}
      tabIndex={disabled ? -1 : 0}
      ref={triggerRef}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsOpen(false);
      }}
    >
      <div className="custom-select-trigger" onClick={() => !disabled && setIsOpen(!isOpen)}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          disabled={disabled}
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            backgroundColor: disabled ? '#f5f5f5' : 'white',
            cursor: disabled ? 'not-allowed' : 'text',
            fontSize: '13px',
            padding: '0',
            margin: '0'
          }}
        />
        <span style={{ fontSize: '10px', color: '#888', marginLeft: '4px' }}>▼</span>
      </div>
      {isOpen && (
        <ul className="custom-select-menu" ref={menuRef}>
          {options.map(opt => (
            <li 
              key={opt} 
              className={opt === value ? 'selected-option' : ''}
              onMouseDown={() => { onChange(opt); setInputValue(opt); setIsOpen(false); }}
              style={opt === value ? { backgroundColor: '#f12c7d', color: 'white' } : {}}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const EditStoreModal = ({ isOpen, onClose, store, onSuccess }) => {
  
  const customStyles = `
    .custom-select-container {
      position: relative;
      background-color: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 13px;
      outline: none;
      user-select: none;
    }
    .custom-select-container:focus-within {
      border-color: #f12c7d;
      box-shadow: 0 0 0 2px rgba(241, 44, 125, 0.1);
    }
    .custom-select-container.disabled {
      background-color: #f5f5f5;
      color: #aaa;
      cursor: not-allowed;
    }
    .custom-select-trigger {
      padding: 6px 8px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .custom-select-trigger input {
      flex: 1;
    }
    .custom-select-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      max-height: 150px;
      overflow-y: auto;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      z-index: 9999;
      list-style: none;
      padding: 0;
      margin: 2px 0 0 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .custom-select-menu li {
      padding: 8px;
      cursor: pointer;
      color: #333;
    }
    .custom-select-menu li:hover {
      background-color: #f12c7d;
      color: white;
    }
    .custom-select-menu li.selected-option {
      background-color: #f12c7d;
      color: white;
    }
    
    /* Image URL input styles */
    .image-url-input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .image-url-input:focus {
      border-color: #f12c7d;
      outline: none;
    }
    .image-preview {
      width: 100%;
      height: 80px;
      object-fit: cover;
      border-radius: 6px;
      margin-top: 4px;
    }
    
    @media (max-width: 390px) {
      .request-modal {
        width: 95% !important;
        padding: 1rem !important;
      }
      .form-group input, .form-group textarea {
        font-size: 14px !important;
      }
    }
  `;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cuisine: [],
    facebook: "",
    instagram: "",
    map_link: ""
  });

  const [imageUrls, setImageUrls] = useState(["", "", ""]);
  const [localHours, setLocalHours] = useState({});
  const [draftStatus, setDraftStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const SPECIAL_STATUS_OPTIONS = [
    { value: "Temporarily Closed", label: "Temporarily Closed", color: "red" },
    { value: "Closed Early", label: "Closed Early", color: "red" },
    { value: "Selling Out Soon", label: "Selling Out Soon", color: "orange" },
    { value: "Drinks & Bites", label: "Drinks & Bites", color: "purple" }
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // ========== LOAD STORE DATA ==========
  useEffect(() => {
    if (store) {
      let cuisineArray = [];
      if (Array.isArray(store.cuisine)) {
        cuisineArray = store.cuisine;
      } else if (typeof store.cuisine === "string") {
        cuisineArray = store.cuisine.split(",").map(c => c.trim());
      }
      
      setFormData({
        name: store.name || "",
        description: store.description || "",
        cuisine: cuisineArray,
        facebook: store.social_media?.facebook || "",
        instagram: store.social_media?.instagram || "",
        map_link: store.map_link || ""
      });
      
      // Load image URLs from store.images array
      if (store.images && Array.isArray(store.images)) {
        const urls = [...store.images.slice(0, 3)];
        while (urls.length < 3) urls.push("");
        setImageUrls(urls);
      } else {
        setImageUrls(["", "", ""]);
      }
      
      setDraftStatus(store.special_status || "");

      const rawHours = store.opening_hours || {};
      const parsedHours = typeof rawHours === 'string' ? JSON.parse(rawHours) : rawHours;
      
      const initialSchedule = {};
      DAYS_OF_WEEK.forEach(day => {
        const dayData = parsedHours[day];
        
        if (dayData && typeof dayData === 'object') {
          initialSchedule[day] = {
            open: dayData.open || "9:00 AM",
            close: dayData.close || "10:00 PM",
            message: dayData.message || "",
            is24Hours: dayData.is24Hours || false,
            isClosed: dayData.isClosed || false
          };
        } 
        else if (typeof dayData === 'string' && dayData.includes(" - ")) {
          const [open, close] = dayData.split(" - ");
          initialSchedule[day] = {
            open: open.trim(),
            close: close.trim(),
            message: "",
            is24Hours: false,
            isClosed: false
          };
        }
        else if (dayData === "Closed") {
          initialSchedule[day] = { open: "9:00 AM", close: "10:00 PM", message: "", is24Hours: false, isClosed: true };
        }
        else {
          initialSchedule[day] = {
            open: "9:00 AM",
            close: "10:00 PM",
            message: "",
            is24Hours: false,
            isClosed: false
          };
        }
      });
      setLocalHours(initialSchedule);
    }
  }, [store]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUrlChange = (index, url) => {
    const newUrls = [...imageUrls];
    newUrls[index] = url;
    setImageUrls(newUrls);
  };

  const handleCuisineToggle = (cuisine) => {
    setFormData(prev => {
      const currentCuisines = [...prev.cuisine];
      if (currentCuisines.includes(cuisine)) {
        return { ...prev, cuisine: currentCuisines.filter(c => c !== cuisine) };
      } else {
        return { ...prev, cuisine: [...currentCuisines, cuisine] };
      }
    });
  };

  const handleScheduleChange = (day, field, value) => {
    setLocalHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleTimeSplitChange = (day, type, part, newValue) => {
    const currentVal = localHours[day][type]; 
    const [time, period] = currentVal.split(" ");
    const finalValue = part === 'num' ? `${newValue} ${period}` : `${time} ${newValue}`;
    handleScheduleChange(day, type, finalValue);
  };

  const handleStatusDraft = (statusValue) => {
    const newValue = draftStatus === statusValue ? "" : statusValue;
    setDraftStatus(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Filter out empty image URLs
      const validImages = imageUrls.filter(url => url && url.trim() !== "");
      
      await api.put(`/stores/${store.id}`, {
        name: formData.name,
        description: formData.description,
        cuisine: formData.cuisine,
        images: validImages,
        special_status: draftStatus,
        opening_hours: localHours,
        map_link: formData.map_link,
        social_media: {
          facebook: formData.facebook,
          instagram: formData.instagram
        }
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update store");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <style>{customStyles}</style>
      <div className="request-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "850px", width: "95%", maxHeight: "90vh", overflowY: "auto", padding: "1.5rem" }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="login-title" style={{ margin: 0, fontSize: '1.5rem' }}>Edit Store Details</h2>
          <button className="modal-close-btn" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer' }}>×</button>
        </div>

        {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        
        <form className="request-form" onSubmit={handleSubmit}>

          {/* ========== 1. IMAGE URLS (3 PICTURES) ========== */}
          <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>🖼️ Store Images (Max 3 - Paste Image URLs)</h3>
          
          {[0, 1, 2].map((index) => (
            <div key={index} className="form-group">
              <label>Image URL {index + 1}</label>
              <input
                type="text"
                className="image-url-input"
                placeholder="https://example.com/image.jpg"
                value={imageUrls[index]}
                onChange={(e) => handleImageUrlChange(index, e.target.value)}
                style={{ padding: '10px', fontSize: '14px', width: '100%' }}
              />
              {imageUrls[index] && (
                <img 
                  src={imageUrls[index]} 
                  alt={`Preview ${index + 1}`} 
                  className="image-preview"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
            </div>
          ))}
          <small style={{ fontSize: '11px', color: '#888', display: 'block', marginTop: '-10px', marginBottom: '15px' }}>
            Paste direct image URLs (from Imgur, Google Photos, etc.). Recommended size: 300x200px
          </small>

          {/* ========== 2. STORE NAME ========== */}
          <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>📋 Basic Information</h3>
          
          <div className="form-group">
            <label>Store Name *</label>
            <input name="name" value={formData.name} onChange={handleChange} required style={{ padding: '10px', fontSize: '14px', width: '100%' }} />
          </div>

          {/* ========== 3. CUISINE CHECKLIST ========== */}
          <div className="form-group">
            <label>Cuisine Type (select all that apply)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
              {CUISINE_OPTIONS.map(cuisine => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => handleCuisineToggle(cuisine)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '25px',
                    border: `1px solid ${formData.cuisine.includes(cuisine) ? '#d81473' : '#ccc'}`,
                    backgroundColor: formData.cuisine.includes(cuisine) ? '#d81473' : '#fff',
                    color: formData.cuisine.includes(cuisine) ? '#fff' : '#333',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: formData.cuisine.includes(cuisine) ? 'bold' : 'normal',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          {/* ========== 4. FACEBOOK URL ========== */}
          <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>📱 Social Media</h3>
          
          <div className="form-group">
            <label>Facebook URL</label>
            <input name="facebook" value={formData.facebook} onChange={handleChange} placeholder="https://facebook.com/yourstore" style={{ padding: '10px', fontSize: '14px', width: '100%' }} />
          </div>

          {/* ========== 5. INSTAGRAM URL ========== */}
          <div className="form-group">
            <label>Instagram URL</label>
            <input name="instagram" value={formData.instagram} onChange={handleChange} placeholder="https://instagram.com/yourstore" style={{ padding: '10px', fontSize: '14px', width: '100%' }} />
          </div>

          {/* ========== 6. DESCRIPTION ========== */}
          <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>📝 Description</h3>
          
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="4" style={{ padding: '10px', fontSize: '14px', width: '100%' }} />
          </div>

          {/* ========== 7. OPENING HOURS ========== */}
          <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>⏰ Opening Hours</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
            {DAYS_OF_WEEK.map(day => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '8px' }}>
                
                <span style={{ width: '90px', fontWeight: 'bold', fontSize: '14px' }}>{day}</span>

                <input 
                  placeholder="Daily message (max 40)" 
                  maxLength={40}
                  value={localHours[day]?.message || ""}
                  onChange={(e) => handleScheduleChange(day, 'message', e.target.value)}
                  style={{ flex: 1, minWidth: '150px', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '4px', padding: '6px 10px', fontSize: '13px' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', opacity: (localHours[day]?.is24Hours || localHours[day]?.isClosed) ? 0.4 : 1 }}>
                  
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <CustomSelect 
                      width="75px"
                      value={localHours[day]?.open.split(" ")[0]} 
                      options={TIME_NUMBERS}
                      disabled={localHours[day]?.is24Hours || localHours[day]?.isClosed}
                      onChange={(val) => handleTimeSplitChange(day, 'open', 'num', val)}
                    />
                    <CustomSelect 
                      width="55px"
                      value={localHours[day]?.open.split(" ")[1]} 
                      options={PERIODS}
                      disabled={localHours[day]?.is24Hours || localHours[day]?.isClosed}
                      onChange={(val) => handleTimeSplitChange(day, 'open', 'period', val)}
                    />
                  </div>

                  <span style={{ color: '#888', fontWeight: 'bold' }}>-</span>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <CustomSelect 
                      width="75px"
                      value={localHours[day]?.close.split(" ")[0]} 
                      options={TIME_NUMBERS}
                      disabled={localHours[day]?.is24Hours || localHours[day]?.isClosed}
                      onChange={(val) => handleTimeSplitChange(day, 'close', 'num', val)}
                    />
                    <CustomSelect 
                      width="55px"
                      value={localHours[day]?.close.split(" ")[1]} 
                      options={PERIODS}
                      disabled={localHours[day]?.is24Hours || localHours[day]?.isClosed}
                      onChange={(val) => handleTimeSplitChange(day, 'close', 'period', val)}
                    />
                  </div>

                </div>

                <div style={{ display: 'flex', gap: '15px', marginLeft: '10px' }}>
                  <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={localHours[day]?.is24Hours || false} onChange={(e) => handleScheduleChange(day, 'is24Hours', e.target.checked)} /> 24hrs
                  </label>
                  <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', color: '#d32f2f', cursor: 'pointer' }}>
                    <input type="checkbox" checked={localHours[day]?.isClosed || false} onChange={(e) => handleScheduleChange(day, 'isClosed', e.target.checked)} /> Closed
                  </label>
                </div>

              </div>
            ))}
          </div>

          {/* ========== 8. SPECIAL STATUS ========== */}
          <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>🎯 Live Status Sticker (Override)</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '15px 0 25px 0' }}>
            {SPECIAL_STATUS_OPTIONS.map(status => (
              <button
                key={status.value}
                type="button"
                onClick={() => handleStatusDraft(status.value)}
                style={{
                  padding: '8px 14px', borderRadius: '20px', border: `2px solid ${status.color}`,
                  backgroundColor: draftStatus === status.value ? status.color : '#fff',
                  color: draftStatus === status.value ? '#fff' : status.color,
                  cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                }}
              >
                {status.label}
              </button>
            ))}
          </div>

          {/* ========== 9. MAP LINK ========== */}
          <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>🗺️ Google Maps Link</h3>
          
          <div className="form-group">
            <label>Google Maps URL</label>
            <input 
              name="map_link" 
              value={formData.map_link} 
              onChange={handleChange} 
              placeholder="https://maps.google.com/..." 
              style={{ padding: '10px', fontSize: '14px', width: '100%' }} 
            />
            <small style={{ fontSize: '11px', color: '#888' }}>Paste the full Google Maps link to your store location</small>
          </div>

          {/* ========== BUTTONS ========== */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '30px' }}>
            <button type="submit" className="submit-request-btn" style={{ flex: 2, padding: '12px', fontSize: '16px' }} disabled={loading}>
              {loading ? "Saving..." : "Save All Changes"}
            </button>
            <button type="button" className="submit-request-btn" style={{ flex: 1, backgroundColor: '#999', padding: '12px', fontSize: '16px' }} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStoreModal;