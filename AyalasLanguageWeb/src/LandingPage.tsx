import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <section id="center">
      <div>
        <h1>Ayala's Language App</h1>

        <div className="form-row">
          <Link className="home-link" to="/home">Login</Link> to the language app
        </div>
        <div className="form-row">
          <Link className="home-link" to="/register">Register</Link> a new account
        </div>
      </div>
    </section>
  );
}
