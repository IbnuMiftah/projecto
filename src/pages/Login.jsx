import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import './auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__ambient" />

      <div className="auth-card animate-fade-in-up">
        {/* Brand */}
        <div className="auth-card__header">
          <div className="auth-card__logo">
            <Shield size={28} strokeWidth={1.5} />
          </div>
          <h1 className="auth-card__title">A.M.A.N.A.H</h1>
          <p className="auth-card__subtitle" style={{ fontSize: 'var(--font-size-xs)', letterSpacing: '0.04em', color: 'var(--outline)', marginBottom: 'var(--space-2)' }}>
            Automated Membership And Networked Aid Hub
          </p>
          <p className="auth-card__subtitle">
            Enter your credentials to access the system.
          </p>
        </div>

        {/* Status indicator */}
        <div className="auth-card__status">
          <span className="auth-card__status-dot" />
          <span className="auth-card__status-text">System Online</span>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-card__error">
            <AlertCircle size={16} strokeWidth={1.5} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="auth-card__form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-field__label" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              className="auth-field__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="worker@amanah.org"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="login-password">
              Password
            </label>
            <div className="auth-field__input-wrap">
              <input
                id="login-password"
                className="auth-field__input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-field__toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="auth-card__actions">
            <Link to="/forgot-password" className="auth-card__forgot">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="auth-card__submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="auth-card__footer">
          Don't have an account?{' '}
          <Link to="/signup" className="auth-card__link">
            Request Access
          </Link>
        </p>

        <p className="auth-card__legal">
          By accessing this portal, you agree to the A.M.A.N.A.H governance protocols.
          All operations are logged for institutional transparency.
        </p>
      </div>
    </div>
  );
}
