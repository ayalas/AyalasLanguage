import { AboutSnippet } from "../../components/AboutSnippet";
import { AuthHeader } from "../../components/auth/AuthHeader";
import { WelcomeSnippet } from "../../components/WelcomeSnippet";

export function AboutAuthenticatedUserPage() {
    return (
        <>
            <AuthHeader />
            <div className="form-container">
                <WelcomeSnippet isPublic={false} />
                <AboutSnippet />
            </div>
        </>);
}