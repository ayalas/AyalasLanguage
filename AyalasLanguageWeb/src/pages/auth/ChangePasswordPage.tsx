import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { checkPasswordStrength, generatePasswordFeedback } from '../../utils/utils';

export function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    try {
      const resCheck = checkPasswordStrength(newPassword);
      if (!resCheck.isValid) {
        const feedback = generatePasswordFeedback(resCheck.checks);
        setError(feedback.message);
        return;
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ oldPassword, newPassword })
      });

      if (response.ok) {
        setError("");
        setPasswordChanged(true);
      } else {
        setError(`${response.statusText} (${response.status})`);
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <>
      <AuthHeader />
      <div className="form-container">
        {passwordChanged ? (
          <h3>Password changed successfully.</h3>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-header">
              <h1>Change Password</h1>
            </div>
            <div className="form-row">
              <div className="form-input-row">
                <button type="submit" className="form-button" title="Change Password"><Save /></button>
              </div>
            </div>
            {error !== "" && (
              <div className="form-row">
                <label className="form-error">{error}</label>
              </div>
            )}
            <div className="form-row">
              <div className="form-label-cell">
                <label className="form-label">Old Password</label>
              </div>
              <div className="form-input-cell">
                <input type="password" className="form-input" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-label-cell">
                <label className="form-label">New Password</label>
              </div>
              <div className="form-input-cell">
                <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
