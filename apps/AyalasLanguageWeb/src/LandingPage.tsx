import { PublicHeader } from './components/PublicHeader';
import { WelcomeSnippet } from './components/WelcomeSnippet';

export default function LandingPage() {
  return (
    <>
      <PublicHeader />
      <div  className="form-container">
          <WelcomeSnippet isPublic={true} />
      </div>
    </>
  );
}
