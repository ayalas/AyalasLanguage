import { Link } from "react-router-dom";
import { PublicHeader } from "../components/PublicHeader";
import { BRAND_NAME } from "../constants/learning";

export function DownloadAppPage() {
    return (
        <>
            <PublicHeader />
            <div className="form-container">
                <div className="about-header">
                <div className="androidIcon" title="Android icons created by Swifticons - Flaticon" ></div><h1>Available on android!</h1>
                </div>
                <div className="form-label-row">
                    <Link target="_blank" to="https://github.com/ayalas/AyalasLanguage/releases/latest">Download {BRAND_NAME} on Android</Link>
                </div>
            </div>
        </>);
}