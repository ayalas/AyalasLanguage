import { useState } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import type { User } from '../../types/shared/User';
import { errorHandler } from '@ayalaslanguage/types/error';

export function LanguageLineForDelete({ languageInfo, user, login, reloadLanguageSettings }:
  { languageInfo: any; user: User | null; login: (u: User) => void; reloadLanguageSettings: (a: any, u: any, l: any) => void }) {
  const [error, setError] = useState('');
  const [exists, setExists] = useState(true);

  async function onButtonClick(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await axios.delete(`/api/profile/${languageInfo.languageId}`);
      setExists(false); //disappear from screen
      reloadLanguageSettings(axios, user, login);
    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  }
  return (
    <>
      {exists && (
        <div className="form-row">
          <div className="content-line-part">
            <button data-testid="delete-item" type="button" className="form-button button-delete-item" onClick={onButtonClick}>
              <Trash2 className="small-icon" />
            </button>
            {languageInfo.nativeName} ({languageInfo.englishName})
          </div>
        </div>
      )}
      {error !== '' && (
        <div className="form-row">
          <label className="form-error">{error}</label>
        </div>
      )}
    </>
  );
}
