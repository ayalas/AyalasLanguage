
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthHeader } from '../components/AuthHeader';

import axios from 'axios';


export function Profile() {
    const [allLanguages, setAllLanguages] = useState([]);
    const [targetLanguage, setTargetLanguage] = useState("");
    const [knownLanguage, setKnownLanguage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        async function loadData() {
            let response = await axios.get("/api/static/languages");
            const allLanguagesData = response.data;
            setAllLanguages(allLanguagesData);

            response = await axios.get("/api/profile/current");

            const profileData = response.data;
            if (profileData) {
                if (profileData.targetLanguageId > 0) {
                    setTargetLanguage(profileData.targetLanguageId)
                }
                if (profileData.knownLanguageId > 0) {
                    setKnownLanguage(profileData.knownLanguageId)
                }
                else {
                    const english = allLanguagesData.find(lang => lang.code == 'en');
                    setKnownLanguage(english.languageId);
                }
            }
        }
        loadData();
    }, []); //run once

    const validateForm = function (onlyClear) {
        if (knownLanguage == "" || targetLanguage == "") {
            if (!onlyClear) {
                setError("Please select langauge to learn and language you know.")
            }
            return false;
        }
        else {
            setError("");
            return true;
        }
    }

    const changeTargetLanguage = function (e) {
        setTargetLanguage(e.target.value);
        validateForm(true);
    }
    const changeKnownLanguage = function (e) {
        setKnownLanguage(e.target.value);
        validateForm(true);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!validateForm(false)) {
                return;
            }
            //todo: allow display name and exercise types update
            await axios.post('/api/profile/current', {
                TargetLanguageId: Number(targetLanguage),
                KnownLanguageId: Number(knownLanguage)
            });
            navigate('/home');
        } catch (err) {
            setError(err.message);
        }
    };

    return (allLanguages && allLanguages.length > 0 &&
        <>
            <AuthHeader />
            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-header">
                        <h1>Profile</h1>
                    </div>
                    {error != "" && (
                        <div className="form-row">
                            <label className="form-error">{error}</label>
                        </div>
                    )}
                    <div className="form-row">
                        <div className="form-label-cell">
                            <label className="form-label">Language to Learn</label>
                        </div>
                        <div className="form-input-cell">
                            <select required="true" id="target-langauge" className="form-select" value={targetLanguage} onChange={changeTargetLanguage}>
                                <option value="" disabled>-- Please choose an option --</option>
                                {
                                    allLanguages.map((language) => {
                                        return (
                                            <option key={language.languageId} value={language.languageId}>
                                                {language.englishName != language.nativeName ? `${language.englishName} ${language.nativeName}` : language.englishName}
                                            </option>
                                        );
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
                            <select required="true" id="known-langauge" className="form-select" value={knownLanguage} onChange={changeKnownLanguage}>
                                <option value="" disabled>-- Please choose an option --</option>
                                {
                                    allLanguages.map((language) => {
                                        return (
                                            <option key={language.languageId} value={language.languageId}>
                                                {language.englishName != language.nativeName ? `${language.englishName} ${language.nativeName}` : language.englishName}
                                            </option>
                                        );
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