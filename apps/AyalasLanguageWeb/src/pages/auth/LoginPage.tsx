import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';

import { useAuth } from '../../components/auth/useAuth';
import { errorHandler } from '@ayalaslanguage/types/error';
import axios from 'axios';
import { PublicHeader } from '../../components/PublicHeader';
import type { User } from '../../types/shared/User';
import { TWO_FACTOR_CODE_LENGTH, type LoginRequest, type LoginResponse, type Verify2FARequest } from '@ayalaslanguage/types/auth';
import { TabLinksComponent } from '../../components/tabs/TabLinksComponent';
import { AUTH_TABS, AuthTabsEnum } from '../../constants/auth';

export default function LoginPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const searchUserName = searchParams.get('user') ?? '';
  const [email, setEmail] = useState(searchUserName);
  const [password, setPassword] = useState('');
  const [on2FA, setOn2FA] = useState(false);
  const [verify2FAToken, setVerify2FAToken] = useState('');
  const [code, setCode] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  function completeLogin(tmpUser: User) {
    try {
      login(tmpUser);

      if (tmpUser.languageSettings?.knownLanguageId == null || tmpUser.languageSettings?.targetLanguageId == null) {
        if (from != null) {
          navigate('/profile', { state: { from: { pathname: from } }, replace: true });
        }
        else {
          navigate('/profile');
        }
        return;
      }

      if (from != null) {
        navigate(from, { replace: true });
      }
      else {
        navigate('/home');
      }
    } catch (err) {
      errorHandler(err, setError);
    }
  }

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    try {
      if (on2FA) {
        const response = await axios.post<LoginResponse<User>>('/api/auth/verify2fa', { verify2FAToken, code } as Verify2FARequest);

        completeLogin(response.data.user);
      }
      else {
        const response = await axios.post<LoginResponse<User>>('/api/auth/login', { userName: email, password } as LoginRequest);

        if (response.data.requires2FA) {
          setOn2FA(true);
          setVerify2FAToken(response.data.verify2FAToken);
        }
        else {
          completeLogin(response.data.user);
        }
      }
    } catch (err) {
      errorHandler(err, setError);
    }
  };

  return (
    <>
      <PublicHeader />
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <TabLinksComponent tabData={AUTH_TABS} activeTab={AuthTabsEnum.Login} />
          <div className="form-row">
            <div className="form-button-cell">
              <button data-testid="log-in" type="submit" className="form-button login-button"><LogIn /> Log In</button>
            </div>
          </div>
          {error !== "" && (
            <div className="form-row">
              <label className="form-error">{error}</label>
            </div>
          )}
          {on2FA && (
            <div className="form-input-row">
              <div className="form-label-cell">
                <label className="form-label">Two Factor Authentication Code</label>
              </div>
              <div className="form-input-cell">
                <input data-testid="code" type="text" maxLength={TWO_FACTOR_CODE_LENGTH} required={true} value={code} className="form-input" onChange={e => setCode(e.target.value)} />
              </div>
              <div className="form-cell-footer">Fill the 6-digit code that has been sent to you by email</div>
            </div>
          ) || (
              <>
                <div className="form-input-row">
                  <div className="form-label-cell">
                    <label className="form-label">Email</label>
                  </div>
                  <div className="form-input-cell">
                    <input data-testid="email" type="email" maxLength={128} required={true} value={email} className="form-input" onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="form-input-row">
                  <div className="form-label-cell">
                    <label className="form-label">Password</label>
                  </div>
                  <div className="form-input-cell">
                    <input data-testid="password" required={true} maxLength={32} type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                </div>
              </>
            )}
          <div className="form-row">
            <div className="login-register-line"><Link to={`/forgot?user=${encodeURIComponent(email)}`}>Forgot your password?</Link></div>
          </div>
          <div className="form-row">
            <div className="login-register-line" data-testid="register-link">Or <Link  to="/register">Register</Link> a new account</div>
          </div>
        </form>
      </div>
    </>
  );
}
