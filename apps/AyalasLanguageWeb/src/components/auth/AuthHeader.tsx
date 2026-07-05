import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { Mail, SquareMenu, Volleyball } from 'lucide-react';
import axios from 'axios';
import { switchLanguage } from '../../utils/languageUtils';
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  useClick,
  useDismiss,
  useInteractions
} from '@floating-ui/react';
import type { User } from '../../types/shared/User';
import { BRAND_NAME } from '../../constants/public';
import { errorHandler } from '@ayalaslanguage/types/error';

type OutletAuthContext = {
  user?: User | null;
  logout?: () => void;
  login?: (u: User) => void;
};

export const LANGUAGE_INDICATOR_ENUM = {
  NONE: 0,
  SWITCH: 1,
  SHOW_LANGUAGE: 2
};

export type LanguageIndicator = typeof LANGUAGE_INDICATOR_ENUM[keyof typeof LANGUAGE_INDICATOR_ENUM];

type SwitchLanguageFunc = (axiosInstance: any, user: User | null | undefined, loginFn: ((u: User) => void) | undefined, targetLanguageId: number, knownLanguageId?: number) => Promise<User>;

export function AuthHeader({ languageIndicator = LANGUAGE_INDICATOR_ENUM.NONE }: { languageIndicator?: LanguageIndicator }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | number>('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const { user, logout, login } = useOutletContext<OutletAuthContext>();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadLanguage = async function () {
      if (!user || !user.languageSettings) return;

      const targetId = user.languageSettings.targetLanguageId;
      if (targetId != null) {
        setSelectedLanguageId(targetId);
        setSelectedLanguage(user.languageSettings.targetLanguageEnglishName || '');
      }
    };
    loadLanguage();
  }, [user]);

  const { refs: { setFloating, setReference }, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift()],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, { outsidePress: true });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  const logoutAction = async function () {
    try {
      await axios.post('/api/auth/logout');
      logout?.();
      navigate(`/`);
    }
    catch (err) {
      errorHandler(err, setError);
    }
  }

  async function onChangeLanguage(e: React.ChangeEvent<HTMLSelectElement>) {
    e.preventDefault();
    try {
      const val = Number(e.target.value);
      setSelectedLanguageId(val);
      const fn = switchLanguage as unknown as SwitchLanguageFunc;
      const newUser = await fn(axios, user, login, val, user?.languageSettings?.knownLanguageId);
      setSelectedLanguage(newUser.languageSettings?.targetLanguageEnglishName ?? '');
    } catch (err) {
      console.error('Language switch error:', err);
    }
  }

  return (
    <>
      <div className="header-row">
        <div className="header-title">
          <Link className="header-app-link" to="/home"><div className="logo" ></div></Link>
        </div>

        <div className="header-profile-container">
            <div className="header-profile-name">
              {user?.displayName}
              <div className="header-score" title="Total Score"><Volleyball /> {user?.languageSettings?.score}</div>
            </div>
        </div>
        <Link ref={setReference as any} {...getReferenceProps()} to="#">
          <SquareMenu />
        </Link>

        {isOpen && (
          <div className="menu-container"
            ref={setFloating}
            style={{ ...floatingStyles }}
            {...getFloatingProps()}
          >
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li className="menu-line"><Link to='/profile' className="menu-item">Profile settings</Link></li>
              <li className="menu-line"><Link to='/account' className="menu-item">Manage account</Link></li>
              <li className="menu-line"><Link to='/usernote' className="menu-item"><Mail />&nbsp;Contact Us</Link></li>
              <li className="menu-line"><Link target='discord' to='https://discord.gg/UkzNfauGd' className="menu-item"><div className="discordIcon" ></div>Discuss on Discord</Link></li>
              <li className="menu-line"><Link to='/userabout' className="menu-item">About {BRAND_NAME}</Link></li>
              <hr className="menu-delimiter" />
              <li className="menu-line"><button onClick={logoutAction} className="menu-item">Logout</button></li>
            </ul>
          </div>
        )}
      </div>
      {languageIndicator !== LANGUAGE_INDICATOR_ENUM.NONE && (
          <div className="switch-container">
        {(user && user.languageSettings && (user.languageSettings.knownLanguageId ?? 0) > 0 && user.languageSettings.otherUserLanguages && user.languageSettings.otherUserLanguages.length > 0 && (
            <div className="header-input-cell">
              {languageIndicator === LANGUAGE_INDICATOR_ENUM.SWITCH && (
                <select id="language-picker" className="header-select" value={String(selectedLanguageId)} onChange={onChangeLanguage} >
                <option key={user.languageSettings.targetLanguageId} value={user.languageSettings.targetLanguageId}>{user.languageSettings.targetLanguageEnglishName}</option>
                {
                  user.languageSettings.otherUserLanguages.map((lang: any) => {
                    return (
                      <option key={lang.languageId} value={lang.languageId}>
                        {lang.englishName}
                      </option>
                    );
                  })
                }
              </select>
              ) || (
                <>
                {selectedLanguage}
                </>
              )}
            </div>
          ))}
        
      </div>
      ) }
      {
        error !== '' && (
          <div className="form-row">
            <label className="form-error">{error}</label>
          </div>
        )
      }
    </>
  );
}
