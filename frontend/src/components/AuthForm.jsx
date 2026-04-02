import React, { useState } from 'react';
import { authService } from '../services/api';
import '../styles/AuthForm.scss';

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

const AuthForm = ({ onSuccess }) => {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordIssues, setPasswordIssues] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [resetStep, setResetStep] = useState('username'); // 'username' | 'new-password' | 'done'

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgotPassword = mode === 'forgot-password';
  const isResetNewPassword = isForgotPassword && resetStep === 'new-password';
  const showPasswordRuleStatus = (isRegister || isResetNewPassword) && password.length > 0;
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const getPasswordMatchStatusClass = () => {
    if (!showPasswordRuleStatus || confirmPassword.length === 0) {
      return 'is-pending';
    }
    return passwordsMatch ? 'is-met' : 'is-unmet';
  };

  const resetForm = () => {
    setName('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setPasswordIssues([]);
    setResetStep('username');
  };

  const toggleMode = () => {
    setMode(isLogin ? 'register' : 'login');
    resetForm();
  };

  const goToForgotPassword = () => {
    setMode('forgot-password');
    resetForm();
  };

  const goToLogin = () => {
    setMode('login');
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordIssues([]);

    if (isForgotPassword) {
      if (resetStep === 'username') {
        if (!name.trim()) {
          setError('Username is required');
          return;
        }
        setSubmitting(true);
        try {
          await authService.forgotPassword({ name });
          setPassword('');
          setConfirmPassword('');
          setResetStep('new-password');
        } catch (err) {
          setError(err.response?.data?.error || 'Could not verify username');
        } finally {
          setSubmitting(false);
        }
        return;
      }

      if (resetStep === 'new-password') {
        if (!password || !confirmPassword) {
          setError('Please enter and confirm your new password');
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        setSubmitting(true);
        try {
          await authService.resetPassword({ name, newPassword: password, confirmPassword });
          setResetStep('done');
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
    }

    if (!name.trim() || !password) {
      setError('Username and password are required');
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const response = isLogin
        ? await authService.login({ name, password })
        : await authService.register({ name, password });

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
            {isForgotPassword && resetStep === 'username' && 'Reset Password'}
            {isForgotPassword && resetStep === 'new-password' && 'Set New Password'}
            {isForgotPassword && resetStep === 'done' && 'Password Reset'}
          </h2>
          <p>
            {isLogin && 'Sign in to continue tracking your mood journey.'}
            {isRegister && 'Set up secure access to your private mood data.'}
            {isForgotPassword && resetStep === 'username' && 'Enter your username to verify your account.'}
            {isForgotPassword && resetStep === 'new-password' && 'Enter and confirm your new password below.'}
          </p>
        </div>

        {isForgotPassword && resetStep === 'done' ? (
          <div className="forgot-password-success">
            <div className="forgot-password-icon">✓</div>
            <p>Your password has been reset successfully. You can now sign in with your new password.</p>
            <button type="button" className="auth-submit" onClick={goToLogin}>
              Sign In
            </button>
          </div>
        ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          {(!isForgotPassword || resetStep === 'username') && (
            <div className="auth-field">
              <label htmlFor="name">Username</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="username"
                placeholder="Your username"
              />
            </div>
          )}

          {!isForgotPassword && (
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder="Enter password"
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

          {isLogin && (
            <div className="auth-forgot-link">
              <button type="button" className="auth-link" onClick={goToForgotPassword}>
                Forgot password?
              </button>
            </div>
          )}

          {isRegister && (
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
                  {passwordRules.map((rule) => {
                    const isMet = rule.test(password);
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
                  <li className={`password-rule ${getPasswordMatchStatusClass()}`}>
                    {getPasswordMatchStatusClass() === 'is-met' ? '✓' : '•'} Passwords match
                  </li>
                </ul>
              </div>
            </>
          )}

          {isResetNewPassword && (
            <>
              <div className="auth-field">
                <label htmlFor="password">New Password</label>
                <div className="password-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Enter new password"
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

              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="password-input-wrap">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
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
                  {passwordRules.map((rule) => {
                    const isMet = rule.test(password);
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
                  <li className={`password-rule ${getPasswordMatchStatusClass()}`}>
                    {getPasswordMatchStatusClass() === 'is-met' ? '✓' : '•'} Passwords match
                  </li>
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
            {submitting
              ? 'Please wait...'
              : isLogin
                ? 'Sign In'
                : isRegister
                  ? 'Create Account'
                  : isForgotPassword && resetStep === 'username'
                    ? 'Verify Username'
                    : isForgotPassword && resetStep === 'new-password'
                      ? 'Reset Password'
                      : 'Continue'}
          </button>
        </form>
        )}

        <div className="auth-divider">
          {isForgotPassword ? (
            resetStep !== 'done' && (
              <button type="button" className="auth-switch" onClick={goToLogin}>
                Back to Sign In
              </button>
            )
          ) : (
            <button type="button" className="auth-switch" onClick={toggleMode}>
              {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
