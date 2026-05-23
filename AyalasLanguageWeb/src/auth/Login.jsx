// Inside src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const Login = () => {
  const [ searchParams ] = useSearchParams();
  const searchUserName = searchParams.get('user');
  const [email, setEmail] = useState(searchUserName);
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
        credentials: 'include', // Vital for getting cookies back from backend
      });

      if (response.ok) {
        const data = await response.json();
        login(data); // Update global auth context state
        navigate('/home'); // Redirect to secured home page
      } else {
        alert('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h1>Login</h1>
        </div>
        <div className="form-row">
          <div className="form-label-cell">
            <label className="form-label">Email</label>
          </div>
          <div className="form-input-cell">
            <input type="text" value={email} className="form-input" onChange={e => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-label-cell">
            <label className="form-label">Password</label>
          </div>
          <div className="form-input-cell">
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-input-cell"></div>
          <div className="form-input-cell">
            <button type="submit" className="login-button">Log In</button>
          </div>
        </div>
      </form>
    </div>
  );
};