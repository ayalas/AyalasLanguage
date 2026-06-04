import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User } from 'lucide-react';

import { checkPasswordStrength, generatePasswordFeedback, isValidEmail } from '../../utils/utils';

export function RegisterPage() {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!isValidEmail(email)) {
                setError("Please enter a valid email address");
                return;
            }
            //validate password strength
            const resCheck = checkPasswordStrength(password);
            if (!resCheck.isValid) {
                const feedback = generatePasswordFeedback(resCheck.checks);
                setError(feedback.message);
                return;
            }

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayname: displayName, username: email, password })
            });

            if (response.ok) {
                const data = await response.json();
                navigate(`/login?user=${data.userName}`); // Update global auth context state
            } else {
                if (response.status == "409") {
                    setError("User already exists");
                }
                else
                    setError(`${response.statusText} (${response.status})`);
            }
        } catch (err) {
            setError(err.messgae);
        }
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit}>
                <div className="form-header">
                    <h1>Register</h1>
                </div>
                <div className="form-row">
                    <div className="form-input-row">
                        <button type="submit" className="form-button" title="Register"><User /></button>
                    </div>
                </div>
                {error != "" && (
                    <div className="form-row">
                        <label className="form-error">{error}</label>
                    </div>
                )}
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
                    <div className="login-register-line">Or <Link to="/login">Login</Link> with an existing account</div>
                </div>
            </form>
        </div>
    );
}