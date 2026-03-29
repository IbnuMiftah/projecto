import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Loader2, AlertCircle, Mail } from 'lucide-react';
import './auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-page__ambient" />
        <div className="auth-card animate-fade-in-up">
          <div className="auth-card__success">
            <div className="auth-card__success-icon">
              <Mail size={40} strokeWidth={1.5} />
            </div>
            <h2 className="auth-card__title">Check Your Email</h2>
            <p className="auth-card__subtitle">
              We've sent a password reset link to <strong>{email}</strong>.
              Follow the link to set a new password.
            </p>
            <Link to="/login" className="auth-card__submit" style={{ textAlign: 'center', display: 'block' }}>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-page__ambient" />

      <div className="auth-card animate-fade-in-up">
        <div className="auth-card__header">
          <div className="auth-card__logo">
            <Shield size={28} strokeWidth={1.5} />
          </div>
          <h1 className="auth-card__title">Reset Password</h1>
          <p className="auth-card__subtitle">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {error && (
          <div className="auth-card__error">
            <AlertCircle size={16} strokeWidth={1.5} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-card__form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-field__label" htmlFor="reset-email">
              Email Address
            </label>
            <input
              id="reset-email"
              className="auth-field__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="worker@amanah.org"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="auth-card__submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending…
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <p className="auth-card__footer">
          Remember your password?{' '}
          <Link to="/login" className="auth-card__link">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
