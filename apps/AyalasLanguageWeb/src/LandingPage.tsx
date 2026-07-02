import { Link, useNavigate } from 'react-router-dom';
import { PublicHeader } from './components/PublicHeader';
import { useEffect } from 'react';
import axios from 'axios';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      axios.get('/api/auth/me').then((response) => {
        if (response.data) {
          navigate('/home');
        }
      }, (_error) => { });
    }
    catch { }
  }, [navigate]);
  return (
    <>
      <PublicHeader />
      <section id="center">
        <div>
          <div className="form-row">
            <Link className="home-link" to="/home">To the language app</Link>
          </div>
          <div className="form-row">
            <Link className="home-link" to="/register">Register</Link> a new account
          </div>
        </div>
      </section>
    </>
  );
}
