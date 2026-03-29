import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import './auth.css';

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const update = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-page__ambient" />
        <div className="auth-card animate-fade-in-up">
          <div className="auth-card__success">
            <div className="auth-card__success-icon">
              <CheckCircle2 size={40} strokeWidth={1.5} />
            </div>
            <h2 className="auth-card__title">Registration Submitted</h2>
            <p className="auth-card__subtitle">
              Your credentials have been submitted. An administrator must
              verify your account before access is granted.
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
          <h1 className="auth-card__title">Request Access</h1>
          <p className="auth-card__subtitle">
            Submit your details to register for the A.M.A.N.A.H system.
            Admin approval is required.
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
            <label className="auth-field__label" htmlFor="signup-name">
              Full Name
            </label>
            <input
              id="signup-name"
              className="auth-field__input"
              type="text"
              value={formData.fullName}
              onChange={update('fullName')}
              placeholder="Ahmed Mohammed"
              required
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="signup-email">
              Email Address
            </label>
            <input
              id="signup-email"
              className="auth-field__input"
              type="email"
              value={formData.email}
              onChange={update('email')}
              placeholder="ahmed@example.com"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="signup-phone">
              Phone Number <span className="auth-field__optional">(optional)</span>
            </label>
            <input
              id="signup-phone"
              className="auth-field__input"
              type="tel"
              value={formData.phone}
              onChange={update('phone')}
              placeholder="+251 9XX XXX XXXX"
            />
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="signup-password">
              Password
            </label>
            <div className="auth-field__input-wrap">
              <input
                id="signup-password"
                className="auth-field__input"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={update('password')}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
              <button
                type="button"
                className="auth-field__toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="signup-confirm">
              Confirm Password
            </label>
            <input
              id="signup-confirm"
              className="auth-field__input"
              type="password"
              value={formData.confirmPassword}
              onChange={update('confirmPassword')}
              placeholder="••••••••"
              required
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
                Submitting…
              </>
            ) : (
              'Submit Registration'
            )}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-card__link">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
