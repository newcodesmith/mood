import React, { useEffect, useState } from 'react';
import { authService } from '../services/api';
import '../styles/AuthForm.scss';

const passwordRules = [
  'Minimum 8 characters',
  'At least one uppercase letter',
  'At least one lowercase letter',
  'At least one number',
  'At least one special character',
  'No spaces'
];

const AuthForm = ({ onSuccess }) => {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [passwordIssues, setPasswordIssues] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tokenFromQuery = queryParams.get('resetToken');

    if (tokenFromQuery) {
      setResetToken(tokenFromQuery);
      setMode('reset');
    }
  }, []);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setNotice('');
    setError('');
    setPasswordIssues([]);
  };

  const toggleMode = () => {
    setMode(isLogin ? 'register' : 'login');
    resetForm();
  };

  const switchToForgot = () => {
    setMode('forgot');
    resetForm();
  };

  const switchToLogin = () => {
    setMode('login');
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordIssues([]);
    setNotice('');

    if (isForgot) {
      if (!email) {
        setError('Email is required');
        return;
      }

      setSubmitting(true);

      try {
        await authService.forgotPassword({ email });
        setNotice('If that email exists, a reset link has been sent.');
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to process password reset request');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (isReset) {
      if (!password || !confirmPassword) {
        setError('New password and confirmation are required');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (!resetToken) {
        setError('Reset token is missing or invalid');
        return;
      }

      setSubmitting(true);

      try {
        await authService.resetPassword({ token: resetToken, password, confirmPassword });
        setNotice('Password reset successful. You can now sign in.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        if (window.location.search.includes('resetToken=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        const apiError = err.response?.data?.error || 'Password reset failed';
        const issues = err.response?.data?.issues || [];
        setError(apiError);
        setPasswordIssues(Array.isArray(issues) ? issues : []);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setError('Name is required');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setSubmitting(true);

    try {
      const response = isLogin
        ? await authService.login({ email, password })
        : await authService.register({ name, email, password });

      onSuccess(response.data.user);
    } catch (err) {
      const apiError = err.response?.data?.error || 'Authentication failed';
      const issues = err.response?.data?.issues || [];
      setError(apiError);
      setPasswordIssues(Array.isArray(issues) ? issues : []);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>
            {isLogin && 'Welcome Back'}
            {isRegister && 'Create Your Account'}
            {isForgot && 'Forgot Password'}
            {isReset && 'Reset Password'}
          </h2>
          <p>
            {isLogin && 'Sign in to continue tracking your mood journey.'}
            {isRegister && 'Set up secure access to your private mood data.'}
            {isForgot && 'Enter your email and we\'ll send a password reset link.'}
            {isReset && 'Choose a new secure password for your account.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="auth-field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Your name"
              />
            </div>
          )}

          {!isReset && (
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
          )}

          {!isForgot && (
            <div className="auth-field">
              <label htmlFor="password">{isReset ? 'New Password' : 'Password'}</label>
              <div className="password-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder={isReset ? 'Enter new password' : 'Enter password'}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}

          {(isRegister || isReset) && (
            <>
              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-wrap">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="password-rules">
                <h4>Password Requirements</h4>
                <ul>
                  {passwordRules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {notice && <div className="auth-notice">{notice}</div>}

          {error && <div className="auth-error">{error}</div>}

          {passwordIssues.length > 0 && (
            <div className="auth-error details">
              <ul>
                {passwordIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting
              ? 'Please wait...'
              : isLogin
                ? 'Sign In'
                : isRegister
                  ? 'Create Account'
                  : isForgot
                    ? 'Send Reset Link'
                    : 'Reset Password'}
          </button>
        </form>


        {mode !== 'forgot' && mode !== 'reset' && (
          <div className="auth-divider">
            <button type="button" className="auth-switch" onClick={toggleMode}>
              {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
            </button>
            {isLogin && (
              <button type="button" className="auth-link" onClick={switchToForgot}>
                Forgot your password?
              </button>
            )}
          </div>
        )}

        {(mode === 'forgot' || mode === 'reset') && (
          <button type="button" className="auth-link" onClick={switchToLogin}>
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
