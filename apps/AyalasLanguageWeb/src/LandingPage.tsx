import { Link } from 'react-router-dom';
import { PublicHeader } from './components/PublicHeader';

export default function LandingPage() {
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
