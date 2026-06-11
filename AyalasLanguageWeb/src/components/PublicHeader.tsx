import { Link } from 'react-router-dom';
import imgLogo from '../assets/logo.jpg';

export function PublicHeader() {
    return (
        <div className="header-row">
            <Link className="header-app-link" to="/home"><img className="logo" src={imgLogo} /></Link>
        </div>
    );
}
