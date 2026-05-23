
import { AuthHeader } from '../components/AuthHeader';

export function Homepage() {
    return (
        <>
            <AuthHeader />
            <div className="home-container">
                <h1>Home</h1>
            </div>
        </>
    );
}