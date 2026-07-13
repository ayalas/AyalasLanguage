import { Link } from "react-router-dom";
import { BRAND_NAME } from "../constants/learning";

export function AboutSnippet() {
    return (
        <>
        <div className="about-header">
            <h1>About this app</h1>
        </div>
        <div className="form-label-row">{BRAND_NAME} is developed by and licensed to Ayala Swisa.
            <br />
            As of now, it is not a commercial project or held by a commercial entity.<br /><br />
            <Link target="_blank" to="https://github.com/ayalas/AyalasLanguage">{BRAND_NAME}'s GitHub page</Link>
        </div>
        </>
    );
}