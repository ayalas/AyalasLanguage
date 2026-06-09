import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

import { useAuth } from '../../components/auth/useAuth';
import { errorHandler } from '../../utils/utils';

export default function LoginPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const searchUserName = searchParams.get('user') ?? '';
  const [email, setEmail] = useState<string>(searchUserName);
  const [password, setPassword] = useState<string>('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        login(data.user);
        if (data.user.languageSettings?.knownLanguageId == null || data.user.languageSettings?.targetLanguageId == null) {
          navigate('/profile');
          return;
        }
        navigate('/home');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      errorHandler(err, setError);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h1>Login</h1>
        </div>
        <div className="form-row">
          <div className="form-button-cell">
            <button type="submit" className="login-button"><LogIn /> Log In</button>
          </div>
        </div>
        {error !== "" && (
          <div className="form-row">
            <label className="form-error">{error}</label>
          </div>
        )}
        <div className="form-input-row">
          <div className="form-label-cell">
            <label className="form-label">Email</label>
          </div>
          <div className="form-input-cell">
            <input type="text" value={email} className="form-input" onChange={e => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="form-input-row">
          <div className="form-label-cell">
            <label className="form-label">Password</label>
          </div>
          <div className="form-input-cell">
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="login-register-line">Or <Link to="/register">Register</Link> a new account</div>
        </div>
      </form>
    </div>
  );
}
