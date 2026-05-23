
import { AuthHeader } from './components/AuthHeader';

export function Homepage() {
    return (
        <>
            <AuthHeader />
            <div className="home-container">
                <h1>Ayala's Langauge App Home</h1>
            </div>
        </>
    );
}