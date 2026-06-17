import { Link } from 'react-router-dom';
import { PublicHeader } from './components/PublicHeader';

export default function LandingPage() {
  return (
    <>
    <PublicHeader />
    <section id="center">
      <div>
        <div className="form-row">
          <Link className="home-link" to="/home">Login</Link> to the language app admin console
        </div>
        <div className="form-row">
          Or <Link className="home-link" to="../home">go back</Link> to the language app
        </div>
      </div>
    </section>
    </>
  );
}
