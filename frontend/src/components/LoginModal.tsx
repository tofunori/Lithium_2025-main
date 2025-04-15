import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import our auth hook
import './LoginModal.css';

// Define the props interface
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [message, setMessage] = useState<string>('');
  
  // Use our auth context
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        // Use signIn from context
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
        onClose(); // Close modal on successful login
      } else if (mode === 'signup') {
        // Use signUp from context
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) throw signUpError;
        setMessage('Success! Check your email to confirm your account.');
        setMode('login');
      } else if (mode === 'reset') {
        // Use resetPassword from context
        const { error: resetError } = await resetPassword(email);
        if (resetError) throw resetError;
        setMessage('Check your email for a password reset link.');
        setMode('login');
      }
    } catch (err: any) {
      console.error(`Error during ${mode}:`, err);
      setError(`Failed: ${err?.message || "An error occurred."}`);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
    setMode(newMode);
    setError('');
    setMessage('');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="login-modal-backdrop">
      <div className="login-modal-content">
        <h2>{mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Reset Password'}</h2>
        {message && <div className="alert alert-success p-2 small">{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="loginEmail" className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              id="loginEmail"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          {mode !== 'reset' && (
            <div className="mb-3">
              <label htmlFor="loginPassword" className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                id="loginPassword"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required={mode !== 'reset'}
                disabled={loading}
              />
            </div>
          )}
          
          {error && <div className="alert alert-danger p-2 small">{error}</div>}
          
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              {mode === 'login' ? (
                <>
                  <button 
                    type="button" 
                    className="btn btn-link p-0 text-decoration-none" 
                    onClick={() => switchMode('signup')}
                    disabled={loading}
                  >
                    Create account
                  </button>
                  <span className="mx-2">|</span>
                  <button 
                    type="button" 
                    className="btn btn-link p-0 text-decoration-none" 
                    onClick={() => switchMode('reset')}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-link p-0 text-decoration-none" 
                  onClick={() => switchMode('login')}
                  disabled={loading}
                >
                  Back to login
                </button>
              )}
            </div>
            
            <div>
              <button type="button" className="btn btn-secondary me-2" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Processing...' : mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Reset'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;