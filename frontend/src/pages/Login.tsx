import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page flex-center animate-fade-in">
      <div className="bg-glow-top" />
      <div className="bg-glow-bottom" />

      <div className="auth-card glass-panel">
        <header className="auth-header">
          <div className="auth-logo">
            <LogIn color="#000" size={32} />
          </div>
          <h1 className="text-gradient">Welcome Back</h1>
          <p className="text-muted">Sign in to continue to SplitMint</p>
        </header>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form flex-column gap-6">
          <div className="input-group">
            <label className="text-small text-muted">Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-premium"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="text-small text-muted">Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={20} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-premium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
          </button>
        </form>

        <footer className="auth-footer text-muted text-center">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">
            Create account
          </Link>
        </footer>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          width: 100%;
          position: relative;
          padding: 1.5rem;
          overflow: hidden;
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          padding: 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .auth-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: center;
        }

        .auth-logo {
          width: 64px;
          height: 64px;
          background: var(--primary);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px -5px var(--primary-glow);
          margin-bottom: 1rem;
        }

        .error-box {
          background: rgba(255, 100, 100, 0.1);
          border: 1px solid rgba(255, 100, 100, 0.2);
          color: var(--error);
          padding: 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          text-align: center;
        }

        .input-with-icon {
          position: relative;
          width: 100%;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          pointer-events: none;
        }

        .input-premium {
          padding-left: 3rem !important;
        }

        .auth-footer {
          margin-top: 1rem;
        }

        .auth-link {
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
          transition: var(--transition);
        }

        .auth-link:hover {
          color: var(--primary-hover);
          text-decoration: underline;
        }

        .bg-glow-top {
          position: absolute;
          top: 0;
          right: 0;
          width: 500px;
          height: 500px;
          background: var(--primary);
          opacity: 0.05;
          filter: blur(120px);
          z-index: -10;
          border-radius: 50%;
        }

        .bg-glow-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 400px;
          height: 400px;
          background: var(--accent);
          opacity: 0.05;
          filter: blur(130px);
          z-index: -10;
          border-radius: 50%;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 2rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;

