import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Save, Send } from 'lucide-react';
import { AuthHeader } from '../../components/auth/AuthHeader';
import type { User } from '../../types/shared/User';
import { checkPasswordStrength, errorHandler, generatePasswordFeedback } from '../../utils/utils';

export function AccountPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountChanged, setAccountChanged] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [error, setError] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const { user, login } = useOutletContext<{ user: User | null; login: (u: User) => void }>();

  const confirmEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {

      await axios.post('/api/auth/confirm');

      setEmailConfirmationSent(true);
    }
    catch (err: unknown) {
      errorHandler(err, setError);
    }
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    try {
      let newPasswordTrimmed: string = "";
      if (newPassword != null && newPassword.length > 0) {
        newPasswordTrimmed = newPassword.trim();
        const resCheck = checkPasswordStrength(newPasswordTrimmed);
        if (!resCheck.isValid) {
          const feedback = generatePasswordFeedback(resCheck.checks);
          setError(feedback.message);
          return;
        }
      }

      if (newPasswordTrimmed == "" && newUserName == "") {
        setError("Nothing to save. This page allows you to change password and email address (unless confirmed).");
        return;
      }

      const res = await axios.post('/api/auth/account', { newUserName, oldPassword, newPassword: newPasswordTrimmed });

      login(res.data);

      setError("");
      setAccountChanged(true);
    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  };

  return (
    <>
      <AuthHeader />
      <div className="form-container">

        {accountChanged ? (
          <div className="form-row">
            <h3>Account details changed successfully.</h3>
          </div>
        ) : emailConfirmationSent ? (
          <>
          <div className="form-row">
            <h3>Email address confirmation sent successfully.</h3>
          </div>
          <div className="form-row">
            <div className="form-content-row">An email address confirmation request has been sent to '{user?.userName}'. Please confirm your email, so you'll be able to recover your account, in case you forget your password. </div>
          </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-header">
              <h1>Account details</h1>
            </div>
            <div className="form-row">
              <div className="form-button-cell">
                <button type="submit" className="form-button"><Save /> Save Changes</button>
              </div>
              <div className="form-button-cell">
                <button type="button" className="form-button" onClick={confirmEmail}><Send /> Confirm Email Address</button>
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
                <input type="password" required={true} className="form-input" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-label-cell">
                <label className="form-label">New Password - Optional: Fill only to change your password</label>
              </div>
              <div className="form-input-cell">
                <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-label-cell">
                <label className="form-label">Email Address - {user?.emailConfirmed && (
                  <> confirmed (Cannot be changed)</>
                ) || (
                    <> Please confirm by clicking Confirm Email Address above.</>
                  )}</label>
              </div>
              <div className="form-input-cell">
                <label className="form-label-content" >{user?.userName}</label>
              </div>
            </div>
            {!user?.emailConfirmed && (
              <div className="form-row">
                <div className="form-label-cell">
                  <label className="form-label">New Email Address - Optional: Fill only to change your email address</label>
                </div>
                <div className="form-input-cell">
                  <input type="text" className="form-input" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </>
  );
}
