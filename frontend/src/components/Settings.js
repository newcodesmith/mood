import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import '../styles/Settings.scss';

const Settings = ({ user, onUpdate, theme, onThemeChange }) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [themePreference, setThemePreference] = useState(theme || 'light');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fileInputKey, setFileInputKey] = useState(0);
  const fileInputRef = React.useRef(null);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setThemePreference(theme || 'light');
  }, [theme]);

  const handleThemeSelect = (nextTheme) => {
    setThemePreference(nextTheme);
    if (onThemeChange) {
      onThemeChange(nextTheme);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, avatar: 'Please select a valid image file' });
      return;
    }

    // Validate file size (2MB max for better database storage)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setErrors({ ...errors, avatar: `Image is too large (${sizeMB}MB). Please use an image smaller than 2MB.` });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      const base64Size = (base64Data.length / (1024 * 1024)).toFixed(2);
      
      // Warn if base64 encoded data is getting large
      if (base64Data.length > 1.5 * 1024 * 1024) {
        console.warn(`Base64 encoded image is ${base64Size}MB - consider using a smaller image for better performance`);
      }
      
      setAvatar(base64Data);
      setErrors({ ...errors, avatar: null });
    };
    reader.onerror = () => {
      setErrors({ ...errors, avatar: 'Failed to read file' });
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = '#0ea5a4';
    e.currentTarget.style.background = 'rgba(14, 165, 164, 0.15)';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = '#0ea5a4';
    e.currentTarget.style.background = 'rgba(14, 165, 164, 0.05)';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = '#0ea5a4';
    e.currentTarget.style.background = 'rgba(14, 165, 164, 0.05)';
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!name || name.trim().length === 0) {
      newErrors.name = 'Name is required';
    }
    if (name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (name.length > 50) {
      newErrors.name = 'Name must be 50 characters or less';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const updated = await userService.update(user.id, { name, avatar });
      onUpdate && onUpdate(updated.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setErrors({ submit: error.response?.data?.error || 'Failed to update profile' });
    }
  };

  if (loading) {
    return <div className="settings loading">Loading...</div>;
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h2>Profile Settings</h2>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-section">
          <h3>Name</h3>
          <div className="form-group">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>Avatar</h3>
          <div className="avatar-section">
            <div className="avatar-upload">
              <label>Upload Image</label>
              <div
                className="upload-area"
                onClick={handleUploadAreaClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  key={fileInputKey}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  aria-label="Upload avatar image"
                />
                <div className="upload-text">
                  <strong>Click to upload</strong> or drag and drop
                  <br />
                  <small>PNG, JPG, GIF up to 2MB</small>
                </div>
              </div>
              {errors.avatar && <span className="error">{errors.avatar}</span>}
            </div>

            <div className="avatar-preview">
              <p className="preview-label">Preview</p>
              {avatar ? (
                <>
                  <img src={avatar} alt="Avatar preview" className="avatar-image" />
                  <button
                    type="button"
                    onClick={() => {
                      setAvatar('');
                      setFileInputKey(prev => prev + 1);
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <div className="avatar-placeholder">👤</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="avatar-url">Or enter image URL</label>
            <input
              id="avatar-url"
              type="text"
              value={avatar && avatar.startsWith('data:') ? '' : avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
            <small>Alternatively, paste a valid image URL</small>
          </div>
        </div>

        <div className="form-section">
          <h3>Appearance</h3>
          <div className="theme-preference">
            <p className="theme-label">Theme mode</p>
            <div className="theme-toggle" role="radiogroup" aria-label="Theme mode">
              <button
                type="button"
                role="radio"
                aria-checked={themePreference === 'light'}
                className={`theme-option ${themePreference === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeSelect('light')}
              >
                ☀️ Light
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={themePreference === 'dark'}
                className={`theme-option ${themePreference === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeSelect('dark')}
              >
                🌙 Dark
              </button>
            </div>
          </div>
        </div>

        {errors.submit && <div className="error-message">{errors.submit}</div>}
        {success && <div className="success-message">✓ Profile updated successfully!</div>}

        <button type="submit" className="submit-btn">Save Changes</button>
      </form>

      <div className="settings-info">
        <p><strong>Account Created:</strong> {user && new Date(user.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default Settings;
