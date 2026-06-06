import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Save } from 'lucide-react';

import { AuthHeader } from '../../components/auth/AuthHeader';
import { switchLanguage, reloadLanguageSettings } from '../../utils/languageUtils';
import { LanguageLineForDelete } from './LanguageLineForDelete';
import type { User, AppLanguageCode } from '../../types/shared/User';

type Language = {
  languageId?: number;
  englishName?: string;
  nativeName?: string;
  code?: AppLanguageCode;
};

export function ProfilePage() {
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);
  const [targetLanguage, setTargetLanguage] = useState<string | number>('');
  const [knownLanguage, setKnownLanguage] = useState<string | number>('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, login } = useOutletContext<{ user: User | null; login: (u: User) => void }>();

  useEffect(() => {
    async function loadData() {
      const response = await axios.get('/api/static/languages');
      const allLanguagesData = response.data as Language[];
      setAllLanguages(allLanguagesData || []);

      if (user?.languageSettings) {
        if (user.languageSettings.targetLanguageId && user.languageSettings.targetLanguageId > 0) {
          setTargetLanguage(user.languageSettings.targetLanguageId as number);
        }
        if (user.languageSettings.knownLanguageId && user.languageSettings.knownLanguageId > 0) {
          setKnownLanguage(user.languageSettings.knownLanguageId as number);
        } else {
          const english = allLanguagesData.find((lang) => lang.code === 'en');
          setKnownLanguage(english?.languageId || '');
        }
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.languageSettings]);

  const validateForm = function (onlyClear?: boolean) {
    if (knownLanguage === '' || targetLanguage === '') {
      if (!onlyClear) {
        setError('Please select langauge to learn and language you know.');
      }
      return false;
    }
    setError('');
    return true;
  };

  const changeTargetLanguage = function (e: ChangeEvent<HTMLSelectElement>) {
    setTargetLanguage(e.target.value);
    validateForm(true);
  };
  const changeKnownLanguage = function (e: ChangeEvent<HTMLSelectElement>) {
    setKnownLanguage(e.target.value);
    validateForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (!validateForm(false)) {
        return;
      }
  if (!user) throw new Error('User must be logged in to change language');
  await switchLanguage(axios, user, login, Number(targetLanguage), Number(knownLanguage));
      navigate('/home');
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'message' in err) ? (err as { message?: string }).message || String(err) : String(err);
      setError(msg);
    }
  };

  return (
    allLanguages && allLanguages.length > 0 && (
      <>
        <AuthHeader />
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-header">
              <h1>Profile</h1>
            </div>
            <div className="form-row">
              <div className="form-input-row">
                <button type="submit" className="form-button" title="Save">
                  <Save />
                </button>
              </div>
            </div>
            {error !== '' && (
              <div className="form-row">
                <label className="form-error">{error}</label>
              </div>
            )}
            <div className="form-input-row">
              <div className="form-label-cell">
                <label className="form-label">Language to Learn</label>
              </div>
              <div className="form-input-cell">
                <select required id="target-langauge" className="form-select" value={targetLanguage} onChange={changeTargetLanguage}>
                  <option value="" disabled>
                    -- Please choose an option --
                  </option>
                  {allLanguages.map((language) => (
                    <option key={language.languageId} value={language.languageId}>
                      {language.englishName !== language.nativeName ? `${language.englishName} ${language.nativeName}` : language.englishName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-input-row">
              <div className="form-label-cell">
                <label className="form-label">Language I Know</label>
              </div>
              <div className="form-input-cell">
                <select required id="known-langauge" className="form-select" value={knownLanguage} onChange={changeKnownLanguage}>
                  <option value="" disabled>
                    -- Please choose an option --
                  </option>
                  {allLanguages.map((language) => (
                    <option key={language.languageId} value={language.languageId}>
                      {language.englishName !== language.nativeName ? `${language.englishName} ${language.nativeName}` : language.englishName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>

          {user?.languageSettings?.otherUserLanguages && user.languageSettings.otherUserLanguages.length > 0 && (
            <div className="form-row">
              <div className="form-content-row">
                <h3>Other languages</h3>
              </div>
              {user.languageSettings.otherUserLanguages.map((lang) => (
                <LanguageLineForDelete key={lang.languageId} languageInfo={lang} user={user} login={login} reloadLanguageSettings={reloadLanguageSettings} />
              ))}
            </div>
          )}
        </div>
      </>
    )
  );
}
