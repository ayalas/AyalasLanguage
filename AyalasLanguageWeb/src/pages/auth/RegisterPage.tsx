import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';
import { checkPasswordStrength, errorHandler, generatePasswordFeedback, isValidEmail } from '../../utils/utils';

export function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    try {
      if (!isValidEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }

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
        setSuccess(true);
      } else {
        if (response.status == 409) {
          setError("User already exists");
        }
        else
          setError(`${response.statusText} (${response.status})`);
      }
    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h1>Register</h1>
        </div>
        {!success && (
          <div className="form-row">
            <div className="form-input-row">
              <button type="submit" className="form-button"><UserIcon /> Complete Registration</button>
            </div>
          </div>
        )}
        {error !== "" && (
          <div className="form-row">
            <label className="form-error">{error}</label>
          </div>
        )}
        {success && (
          <>
          <div className="form-row">
            <h3>Account created successfully.</h3>
          </div>
          <div className="form-row">
            <div className="form-content-row">An email address confirmation request has been sent to '{email}'. Please confirm your email, so you'll be able to recover your account, in case you forget your password. </div>
            <div className="form-content-row">You can do this now, or later on, after you&nbsp;<Link to={`/login?user=${email}`}>log in</Link>&nbsp;and experience with the app.</div>
          </div>
          </>
        ) || (
            <>
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
                <div className="login-register-line">Or <Link to="/login">Log in</Link> with an existing account</div>
              </div>
            </>
          )
        }
      </form>
    </div>
  );
}
