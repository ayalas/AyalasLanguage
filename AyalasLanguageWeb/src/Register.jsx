import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Register() {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayname: displayName, username: email, password }),
        credentials: 'include', // Vital for getting cookies back from backend
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/login?user=${data.userName}`); // Update global auth context state
      } else {
        alert(`${response.statusText} (${response.status})`);
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit}>
                <div className="form-header">
                    <h1>Register</h1>
                </div>
                <div className="form-row">
                    <div className="form-label-cell">
                        <label className="form-label">Display Name</label>
                    </div>
                    <div className="form-input-cell">
                        <input type="text" value={displayName} className="form-input" onChange={e => setDisplayName(e.target.value)} />
                    </div>
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
                        <button type="submit" className="form-button">Register</button>
                    </div>
                </div>
            </form>
        </div>
    );
}