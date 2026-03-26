import React, { useState } from 'react';
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
  const [error, setError] = useState('');
  const [passwordIssues, setPasswordIssues] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === 'login';

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setPasswordIssues([]);
  };

  const toggleMode = () => {
    setMode(isLogin ? 'register' : 'login');
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordIssues([]);

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (!isLogin) {
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
          <h2>{isLogin ? 'Welcome Back' : 'Create Your Account'}</h2>
          <p>{isLogin ? 'Sign in to continue tracking your mood journey.' : 'Set up secure access to your private mood data.'}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
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

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder="Enter password"
            />
          </div>

          {!isLogin && (
            <>
              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                />
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
            {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button type="button" className="auth-switch" onClick={toggleMode}>
          {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
