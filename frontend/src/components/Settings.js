import React, { useState, useEffect } from 'react';
import { authService, userService } from '../services/api';
import '../styles/Settings.scss';

const passwordRules = [
  {
    label: 'Minimum 8 characters',
    test: (value) => value.length >= 8
  },
  {
    label: 'At least one uppercase letter',
    test: (value) => /[A-Z]/.test(value)
  },
  {
    label: 'At least one lowercase letter',
    test: (value) => /[a-z]/.test(value)
  },
  {
    label: 'At least one number',
    test: (value) => /\d/.test(value)
  },
  {
    label: 'At least one special character',
    test: (value) => /[^A-Za-z0-9\s]/.test(value)
  },
  {
    label: 'No spaces',
    test: (value) => !/\s/.test(value)
  }
];

const Settings = ({ user, onUpdate, theme, onThemeChange }) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [themePreference, setThemePreference] = useState(theme || 'light');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordIssues, setPasswordIssues] = useState([]);
  const [avatarError, setAvatarError] = useState(false);
  const fileInputRef = React.useRef(null);
  const showPasswordRuleStatus = newPassword.length > 0;
  const passwordsMatch =
    newPassword.length > 0 &&
    confirmNewPassword.length > 0 &&
    newPassword === confirmNewPassword;

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      // Validate avatar from user data - clear if invalid (like email addresses)
      const avatarUrl = user.avatar || '';
      setAvatar(isValidImageUrl(avatarUrl) ? avatarUrl : '');
      setThemePreference(user.theme_preference || theme || 'light');
      setAvatarError(false);
      setLoading(false);
    }
  }, [theme, user]);

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
      setAvatarError(false);
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

  const isValidImageUrl = (url) => {
    if (!url || url.trim() === '') return true; // Empty is valid (user clearing field)
    if (url.startsWith('data:')) return true; // Base64 is valid
    
    try {
      const urlObj = new URL(url);
      // Check if it has http/https protocol
      if (!urlObj.protocol.startsWith('http')) {
        return false;
      }
      // Check if filename suggests it's an image
      const path = urlObj.pathname.toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      return imageExtensions.some(ext => path.endsWith(ext));
    } catch {
      return false; // Invalid URL format
    }
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
      const updated = await userService.update(user.id, {
        name,
        avatar,
        themePreference
      });
      if (onThemeChange) {
        onThemeChange(themePreference, { persist: true });
      }
      onUpdate && onUpdate(updated.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setErrors({ submit: error.response?.data?.error || 'Failed to update profile' });
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordIssues([]);
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordSubmitting(true);

    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword
      });
      resetPasswordForm();
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error) {
      setPasswordError(error.response?.data?.error || 'Failed to update password');
      const issues = error.response?.data?.issues || [];
      setPasswordIssues(Array.isArray(issues) ? issues : []);
    } finally {
      setPasswordSubmitting(false);
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
                  <img
                    src={avatar}
                    alt="Avatar preview"
                    className="avatar-image"
                    onError={() => setAvatarError(true)}
                  />
                  {avatarError && (
                    <div className="error-message">Invalid image URL (e.g., email address). Please provide a valid image URL or upload a file.</div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAvatar('');
                      setAvatarError(false);
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
              onChange={(e) => {
                const url = e.target.value;
                if (isValidImageUrl(url)) {
                  setAvatar(url);
                  setAvatarError(false);
                } else if (url !== '') {
                  // Show error but don't update avatar state for invalid URLs
                  setErrors({ ...errors, avatar: 'Please enter a valid image URL (e.g., https://example.com/image.jpg)' });
                }
              }}
              placeholder="https://example.com/avatar.jpg"
            />
            <small>Alternatively, paste a valid image URL (must be a direct image link like JPG, PNG, GIF)</small>
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

        <div className="form-section">
          <h3>Change Password</h3>
          <div className="password-change-form">
            <div className="form-group">
              <label htmlFor="current-password">Current Password</label>
              <div className="password-input-wrap">
                <input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrentPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <div className="password-input-wrap">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-new-password">Confirm New Password</label>
              <div className="password-input-wrap">
                <input
                  id="confirm-new-password"
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                  aria-label={showConfirmNewPassword ? 'Hide confirm new password' : 'Show confirm new password'}
                >
                  {showConfirmNewPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="password-rules">
              <h4>Password Requirements</h4>
              <ul>
                {passwordRules.map((rule) => {
                  const isMet = rule.test(newPassword);
                  const statusClass = showPasswordRuleStatus
                    ? isMet
                      ? 'is-met'
                      : 'is-unmet'
                    : 'is-pending';

                  return (
                    <li key={rule.label} className={`password-rule ${statusClass}`}>
                      {showPasswordRuleStatus ? (isMet ? '✓' : '•') : '•'} {rule.label}
                    </li>
                  );
                })}
                <li
                  className={`password-rule ${
                    !showPasswordRuleStatus || confirmNewPassword.length === 0
                      ? 'is-pending'
                      : passwordsMatch
                        ? 'is-met'
                        : 'is-unmet'
                  }`}
                >
                  {!showPasswordRuleStatus || confirmNewPassword.length === 0
                    ? '•'
                    : passwordsMatch
                      ? '✓'
                      : '•'}{' '}
                  Passwords match
                </li>
              </ul>
            </div>

            {passwordError && <div className="error-message">{passwordError}</div>}

            {passwordIssues.length > 0 && (
              <div className="error-message details">
                <ul>
                  {passwordIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {passwordSuccess && <div className="success-message">Password updated successfully.</div>}

            <button type="button" className="submit-btn secondary-submit" disabled={passwordSubmitting} onClick={handleChangePassword}>
              {passwordSubmitting ? 'Updating...' : 'Update Password'}
            </button>
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
