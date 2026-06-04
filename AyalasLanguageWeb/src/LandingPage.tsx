import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <section id="center">
      <div>
        <h1>Ayala's Language App</h1>

        <p>
          <Link className="home-link" to="/home">Login</Link> to the language app
        </p>
        <p>
          <Link className="home-link" to="/register">Register</Link> a new account
        </p>
      </div>
    </section>
  );
}
