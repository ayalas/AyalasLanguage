
import { useState, useEffect } from 'react';
import { AuthHeader } from '../components/AuthHeader';

import axios from 'axios';


export function Profile() {
    const [allLanguages, setAllLanguages] = useState([]);
    const [targetLanguage, setTargetLanguage]= useState("");
    const [knownLanguage, setKnownLanguage]= useState("");

    useEffect(() => {
        axios.get("/api/static/languages").then((response) => {
            setAllLanguages(response.data);
        });

        axios.get("/api/profile").then((response) => {
            const profileData = response.data;
            if (profileData && profileData.current) {
                if (profileData.current.targetLanguageId > 0) {
                    setTargetLanguage(profileData.current.targetLanguageId)
                }
                if (profileData.current.knownLanguageId > 0) {
                    setKnownLanguage(profileData.current.knownLanguageId)
                }
            }
        });
    }, []); //run once

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            /*axios.post('/api/profile', {
                displayName,
                languages,
                exerciseTypes
            });*/
        } catch (err) {
            console.error('Login error:', err);
        }
    };

    return (
        <>
            <AuthHeader />
            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-header">
                        <h1>Profile</h1>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Language to Learn</label>
                        </div>
                        <div className="form-input-cell">
                            <select id="target-langauge" className="form-select" value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)}>
                                <option value="" disabled>-- Please choose an option --</option>
                                {
                                    allLanguages.map((language) => {
                                        <option key={language.languageId} value={language.languageId}>
                                            {language.englishName} {language.nativeName}
                                        </option>
                                    })
                                }
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Language I Know</label>
                        </div>
                        <div className="form-input-cell">
                            <select id="known-langauge" className="form-select" value={knownLanguage} onChange={e => setKnownLanguage(e.target.value)}>
                                <option value="" disabled>-- Please choose an option --</option>
                                {
                                    allLanguages.map((language) => {
                                        <option key={language.languageId} value={language.languageId}>
                                            {language.englishName} {language.nativeName}
                                        </option>
                                    })
                                }
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-input-cell"></div>
                        <div className="form-input-cell">
                            <button type="submit" className="form-button">Save</button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}