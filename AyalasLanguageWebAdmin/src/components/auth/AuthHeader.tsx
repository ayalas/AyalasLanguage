import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { LogOut, SquareMenu, Volleyball } from 'lucide-react';
import axios from 'axios';

import type { User } from '../../types/shared/User';
import { errorHandler } from '../../utils/utils';
import imgLogo from '../../assets/logo.jpg';

type OutletAuthContext = {
  user?: User | null;
  logout?: () => void;
  login?: (u: User) => void;
};

export function AuthHeader() {
  const { user, logout, login } = useOutletContext<OutletAuthContext>();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const logoutAction = async function () {
    try {
      await axios.post('/api/auth/logout');
      logout?.();
      navigate(`/`);
    }
    catch (err) {
      errorHandler(err, setError);
    }
  }

  return (
    <>
      <div className="header-row">
        <div className="header-title">
          <Link className="header-app-link" to="/home"><img className="logo" src={imgLogo} /></Link>
        </div>
        <div className="header-links">
          <div className="header-link"><button data-testid="logout" className="form-button" type="button" onClick={logoutAction}><LogOut /> Log out</button></div>
        </div>
      </div>
      {
        error !== '' && (
          <div className="form-row">
            <label className="form-error">{error}</label>
          </div>
        )
      }
    </>
  );
}
