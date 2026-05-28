
import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Save } from 'lucide-react';

import { AuthHeader } from '../../components/auth/AuthHeader';
import { switchLanguage } from '../../utils/languageUtils';

export function ProfilePage() {
    const [allLanguages, setAllLanguages] = useState([]);
    const [targetLanguage, setTargetLanguage] = useState("");
    const [knownLanguage, setKnownLanguage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { user, login } = useOutletContext();

    useEffect(() => {
        async function loadData() {
            let response = await axios.get("/api/static/languages");
            const allLanguagesData = response.data;
            setAllLanguages(allLanguagesData);

            if (user.languageSettings) {
                if (user.languageSettings.targetLanguageId > 0) {
                    setTargetLanguage(user.languageSettings.targetLanguageId)
                }
                if (user.languageSettings.knownLanguageId > 0) {
                    setKnownLanguage(user.languageSettings.knownLanguageId)
                }
                else {
                    const english = allLanguagesData.find(lang => lang.code == 'en');
                    setKnownLanguage(english.languageId);
                }
            }
        }
        loadData();
    }, [user.languageSettings]); //run once

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
            await switchLanguage(axios, user, login, Number(targetLanguage), Number(knownLanguage));

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
                    <div className="form-row">
                        <div className="form-input-row">
                            <button type="submit" className="form-button" title="Save"><Save /></button>
                        </div>
                    </div>
                    {error != "" && (
                        <div className="form-row">
                            <label className="form-error">{error}</label>
                        </div>
                    )}
                    <div className="form-input-row">
                        <div className="form-label-cell">
                            <label className="form-label">Language to Learn</label>
                        </div>
                        <div className="form-input-cell">
                            <select required={true} id="target-langauge" className="form-select" value={targetLanguage} onChange={changeTargetLanguage}>
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
                    <div className="form-input-row">
                        <div className="form-label-cell">
                            <label className="form-label">Language I Know</label>
                        </div>
                        <div className="form-input-cell">
                            <select required={true} id="known-langauge" className="form-select" value={knownLanguage} onChange={changeKnownLanguage}>
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

                </form>
            </div>
        </>
    );
}