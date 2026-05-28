import { useState } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

export function LanguageLineForDelete({ languageInfo, user, login, reloadLanguageSettings }) {
    const [error, setError] = useState("");
    const [exists, setExists] = useState(true);

    async function onButtonClick(e) {
        e.preventDefault();
        try {
            await axios.delete(`/api/profile/${languageInfo.languageId}`);
            setExists(false); //disappear from screen
            reloadLanguageSettings(axios, user, login);
        }
        catch (err) {
            setError(err.message);
        }
    }
    return (
        <>
            {exists && (
                <div className="form-row">
                   
                    <div className="content-line-part">

                        <button type="button" className="form-button button-delete-item" onClick={onButtonClick} ><Trash2 className="small-icon" /></button>
                        {languageInfo.nativeName} ({languageInfo.englishName})
                    </div>
                </div>
            )}
            {error != "" && (
                <div className="form-row">
                    <label className="form-error">{error}</label>
                </div>
            )}
        </>
    );
}