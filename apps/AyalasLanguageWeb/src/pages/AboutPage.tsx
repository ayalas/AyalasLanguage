import { PublicHeader } from "../components/PublicHeader";
import { BRAND_NAME } from "../constants/public";

export function AboutPage() {

    return (
        <>
            <PublicHeader />
            <div className="form-container">
                <div className="form-header">
                    <h1>About this app</h1>
                </div>
                <div className="form-label-row">{BRAND_NAME} is developed by and licensed to Ayala Swisa.
                    <br />
                    As of now, it is not a commercial project or held by a commercial entity.<br /><br />
                    <a href="https://github.com/ayalas/AyalasLanguage">{BRAND_NAME}'s GitHub page</a></div>
            </div>
        </>);
}