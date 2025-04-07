import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // Assuming firebase.ts exists
import './LoginModal.css'; // We'll create this for basic styling

// Define the props interface
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose(); // Close modal on successful login
    } catch (err) {
      console.error("Error signing in:", err);
      // It's good practice to check the error type if possible, but for now, a generic message is okay.
      if (err instanceof Error) {
        setError(`Failed to log in: ${err.message}`);
      } else {
        setError("Failed to log in. Check email/password.");
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="login-modal-backdrop">
      <div className="login-modal-content">
        <h2>Login</h2>
        <form onSubmit={handleSignIn}>
          <div className="mb-3">
            <label htmlFor="loginEmail" className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              id="loginEmail"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="loginPassword" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="loginPassword"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="alert alert-danger p-2 small">{error}</div>}
          <div className="d-flex justify-content-end">
            {/* Ensure onClick type matches expected if necessary, but usually inferred correctly */}
            <button type="button" className="btn btn-secondary me-2" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Login</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;