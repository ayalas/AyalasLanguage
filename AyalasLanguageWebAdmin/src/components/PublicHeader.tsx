import { Link } from 'react-router-dom';
import imgLogo from '../assets/logo.jpg';
import { LogIn } from 'lucide-react';

export function PublicHeader() {
    return (
        <div className="header-row">
            <div className="header-title">
                <Link className="header-app-link" to="/admin/home"><img className="logo" src={imgLogo} /></Link>
            </div>
            <div className="header-links">
                <div className="header-link"><Link to="/admin/login" className="link-button header-link-item"><LogIn /> Log in</Link></div>
            </div>
        </div>
    );
}
