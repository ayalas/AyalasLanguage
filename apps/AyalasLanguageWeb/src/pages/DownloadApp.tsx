import { Link } from "react-router-dom";
import { PublicHeader } from "../components/PublicHeader";
import { BRAND_NAME } from "../constants/learning";

export function DownloadAppPage() {
    return (
        <>
            <PublicHeader />
            <div className="form-container">
                <div className="about-header">
                <h1><div className="androidIcon" title="Android icons created by Swifticons - Flaticon" ></div>Available on Android!</h1>
                </div>
                <div className="form-label-row">
                    Download the latest version of {BRAND_NAME} for Android from <Link target="_blank" to="https://github.com/ayalas/AyalasLanguage/releases/latest">its GitHub releases page</Link>. Click on the .apk file to download. You'll be prompted to install it, if you're browsing from an Android device. You may need to allow installation from unknown sources in your device settings.
                </div>
            </div>
        </>);
}