import { useState } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import axios from 'axios';

import type { User } from '../../types/User';
import { errorHandler } from '@ayalaslanguage/types/error';
import imgLogo from '../../assets/logo.jpg';

type OutletAuthContext = {
  user?: User | null;
  logout?: () => void;
  login?: (u: User) => void;
};

export function AuthHeader() {
  const { logout } = useOutletContext<OutletAuthContext>();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const logoutAction = async function () {
    try {
      await axios.post('/admin/api/auth/logout');
      logout?.();
      navigate('/');
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
          <div className="header-link"><Link to="/exercises" data-testid="exercises" className="link-button" >Exercises</Link></div>
          <div className="header-link"><Link to="/paths" data-testid="paths" className="link-button" >Lessons</Link></div>
          <div className="header-link"><Link to="/jobs" data-testid="jobs" className="link-button" >Jobs</Link></div>
          <div className="header-link"><Link to="/log" data-testid="log" className="link-button" >Log</Link></div>
          <div className="header-link"><Link to="/contactus" data-testid="contactus" className="link-button" >Contact Us</Link></div>
          <div className="header-link"><Link to="/logins" data-testid="logins" className="link-button" >Logins</Link></div>
          <div className="header-link"><Link to="/users" data-testid="users" className="link-button" >Users</Link></div>
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
