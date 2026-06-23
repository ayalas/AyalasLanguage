import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Save, Send } from 'lucide-react';
import { errorHandler } from '@ayalaslanguage/types/error';
import { AuthHeader } from '../../components/auth/AuthHeader';
import type { User } from '../../types/shared/User';
import { checkPasswordStrength, generatePasswordFeedback } from '../../utils/utils';

export function AccountPage() {
  const [displayName, setDisplayName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [use2FALogin, setUse2FALogin] = useState(false);
  const [accountChanged, setAccountChanged] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [error, setError] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const { user, login } = useOutletContext<{ user: User | null; login: (u: User) => void }>();
  const navigate = useNavigate();

  const confirmEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {

      await axios.post('/api/auth/confirm');

      setEmailConfirmationSent(true);
      setTimeout(() => {
        navigate('/home');
      }, 3000);
    }
    catch (err: unknown) {
      errorHandler(err, setError);
    }
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    try {
      let newPasswordTrimmed: string = "";
      const newUserNameTrimmed = newUserName.trim();
      if (newPassword != null && newPassword.length > 0) {
        newPasswordTrimmed = newPassword.trim();

        if (newPasswordConfirm == null) {
          setError("Must fill New Password Confirm, if New Password is filled.");
          return;
        }

        const newPasswordConfirmTrimmed = newPasswordConfirm.trim();

        if (newPasswordTrimmed.length == 0) {
          setError("New Password and Password Confirm are required. New Password contains only whitespace.")
          return;
        }

        if (newPasswordTrimmed != newPasswordConfirmTrimmed) {
          setError("New Password and Password Confirm must be identical.")
          return;
        }

        const resCheck = checkPasswordStrength(newPasswordTrimmed);
        if (!resCheck.isValid) {
          const feedback = generatePasswordFeedback(resCheck.checks);
          setError(feedback.message);
          return;
        }
      }

      const res = await axios.post('/api/auth/account', { newUserName: newUserNameTrimmed, oldPassword, newPassword: newPasswordTrimmed, use2FALogin, displayName });

      login(res.data);

      setError("");
      setAccountChanged(true);
      setTimeout(() => {
        navigate('/home');
      }, 3000);
    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  };

  useEffect(() => {
    async function runAsync() {
      if (user != null) {
        setUse2FALogin(user?.use2FALogin);
        if (user?.displayName != null) {
          setDisplayName(user?.displayName);
        }
      }
    }
    runAsync();
  }, [user]);

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
              <h1>Account Details</h1>
            </div>
            <div className="form-row">
              <div className="form-button-cell">
                <button data-testid="save" type="submit" className="form-button"><Save /> Save Changes</button>
              </div>
              {!user?.emailConfirmed && (
                <div className="form-button-cell">
                  <button data-testid="send" type="button" className="form-button" onClick={confirmEmail}><Send /> Confirm Email Address</button>
                </div>
              )}

            </div>
            {error !== "" && (
              <div className="form-row">
                <label className="form-error">{error}</label>
              </div>
            )}
            <div className="form-row">
              <div className="form-label-cell">
                <label className="form-label">First Name</label>
              </div>
            </div>
            <div className="form-row">
              <div className="form-input-cell">
                <input data-testid="display-name" type="text" maxLength={128} required={true} className="form-input" value={displayName} onChange={e => setDisplayName(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-label-cell">
                <label className="form-label">Email Address: {user?.userName}</label>
              </div>
              <div className="form-cell-footer">{user?.emailConfirmed && (
                <>Confirmed (cannot be changed)</>
              ) || (
                  <> Please confirm your email address by clicking Confirm Email Address above.</>
                )}</div>
            </div>
            {user?.emailConfirmed && (
              <>
                <div className="form-row">
                  <div className="form-label-cell">
                    <label className="form-label"><input data-testid="use-2fa" type="checkbox" checked={use2FALogin} onChange={(e) => { setUse2FALogin(e.target.checked) }} />Use Two Factor Authentication</label>
                  </div>
                  <div className="form-cell-footer">Protect your account: every time you login, you will be required to provide an extra code sent to you by email</div>
                </div>
              </>
            )}
            <div className="form-row">
              <div className="form-label-cell">
                <label className="form-label">Current Password</label>
              </div>
            </div>
            <div className="form-row">
              <div className="form-input-cell">
                <input data-testid="current-password" type="password" maxLength={32} required={true} className="form-input" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-label-cell">
                <label className="form-label">New Password</label>
              </div>

            </div>
            <div className="form-row">
              <div className="form-input-cell">
                <input data-testid="new-password" type="password" maxLength={32} className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="form-cell-footer">Fill only to change your password and click Save Changes</div>
            </div>
            <div className="form-row">
              <div className="form-label-cell">
                <label className="form-label">Confirm New Password</label>
              </div>
            </div>
            <div className="form-row">
              <div className="form-input-cell">
                <input data-testid="confirm-new-password" maxLength={32} type="password" className="form-input" value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} />
              </div>
            </div>

            {!user?.emailConfirmed && (
              <>
                <div className="form-row">
                  <div className="form-label-cell">
                    <label className="form-label">New Email Address</label>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-input-cell">
                    <input data-testid="new-email-address" maxLength={128} type="text" className="form-input" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                  </div>
                  <div className="form-cell-footer">Fill only to change your email address and click Save Changes.</div>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </>
  );
}
