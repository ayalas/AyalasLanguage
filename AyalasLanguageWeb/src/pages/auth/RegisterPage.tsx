import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';
import axios from 'axios';
import { checkPasswordStrength, errorHandler, generatePasswordFeedback, isValidEmail } from '../../utils/utils';
import { PublicHeader } from '../../components/PublicHeader';

export function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    try {
      if (!isValidEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }

      if (password == null || passwordConfirm == null) {
        setError("Password and Password Confirm are required.")
        return;
      }

      const newPasswordTrimmed = password.trim();
      const newPasswordConfirmTrimmed = passwordConfirm.trim();
      if (newPasswordTrimmed.length == 0) {
        setError("Password and Password Confirm are required. Password contains only whitespace.")
        return;
      }

      if (newPasswordTrimmed != newPasswordConfirmTrimmed) {
        setError("Password and Password Confirm must be identical.")
        return;
      }

      const resCheck = checkPasswordStrength(newPasswordTrimmed);
      if (!resCheck.isValid) {
        const feedback = generatePasswordFeedback(resCheck.checks);
        setError(feedback.message);
        return;
      }

      await axios.post('/api/auth/register',
        { displayname: displayName, username: email, password: newPasswordTrimmed });

      setSuccess(true);

    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  };

  return (
    <>
      <PublicHeader />
      <div className="form-container">
        <form onSubmit={handleSubmit} data-testid="main-form">
          <div className="form-header">
            <h1>Register</h1>
          </div>
          {!success && (
            <div className="form-row">
              <div className="form-input-row">
                <button type="submit" data-testid="complete-registration" className="form-button"><UserIcon /> Complete Registration</button>
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
                    <input data-testid="display-name" type="text" value={displayName} required={true} className="form-input" onChange={e => setDisplayName(e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-label-cell">
                    <label className="form-label">Email</label>
                  </div>
                  <div className="form-input-cell">
                    <input data-testid="email" type="text" value={email} required={true} className="form-input" onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-label-cell">
                    <label className="form-label">Password</label>
                  </div>
                  <div className="form-input-cell">
                    <input data-testid="password" type="password" required={true} className="form-input" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-label-cell">
                    <label className="form-label">Confirm Password</label>
                  </div>
                  <div className="form-input-cell">
                    <input data-testid="confirm-password" type="password" required={true} className="form-input" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
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
    </>
  );
}
