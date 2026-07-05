import { AboutSnippet } from "../../components/AboutSnippet";
import { PublicHeader } from "../../components/PublicHeader";
import { WelcomeSnippet } from "../../components/WelcomeSnippet";

export function AboutPublicPage() {
    return (
        <>
            <PublicHeader />
            <div className="form-container">
                <WelcomeSnippet isPublic={true} />
                <AboutSnippet />
            </div>
        </>);
}