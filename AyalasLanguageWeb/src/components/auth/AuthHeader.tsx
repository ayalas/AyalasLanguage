import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { SquareMenu, Volleyball } from 'lucide-react';
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

type OutletAuthContext = {
  user?: User | null;
  logout?: () => void;
  login?: (u: User) => void;
};

type SwitchLanguageFunc = (axiosInstance: any, user: User | null | undefined, loginFn: ((u: User) => void) | undefined, targetLanguageId: number, knownLanguageId?: number) => Promise<User>;

export function AuthHeader({ hideAppTitle }: { hideAppTitle?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | number>('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showLanguageNextToProfile, setShowLanguageNextToProfile] = useState(!hideAppTitle);
  const { user, logout, login } = useOutletContext<OutletAuthContext>();
  const navigate = useNavigate();

  useEffect(() => {
    const loadLanguage = async function () {
      if (!user || !user.languageSettings) return;

      const targetId = user.languageSettings.targetLanguageId;
      if (targetId != null) {
        setSelectedLanguageId(targetId);
        setSelectedLanguage(user.languageSettings.targetLanguage || '');

        if (!showLanguageNextToProfile && (!user.languageSettings.otherUserLanguages || user.languageSettings.otherUserLanguages.length === 0)) {
          setShowLanguageNextToProfile(true);
        }
      } else {
        setShowLanguageNextToProfile(false);
      }
    };
    loadLanguage();
  }, [user, showLanguageNextToProfile]);

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
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (response.ok) {
      logout?.();
      navigate(`/`);
    } else {
      alert(`${response.statusText} (${response.status})`);
    }
  }

  async function onChangeLanguage(e: React.ChangeEvent<HTMLSelectElement>) {
    e.preventDefault();
    try {
      const val = Number(e.target.value);
      setSelectedLanguageId(val);
  const fn = switchLanguage as unknown as SwitchLanguageFunc;
  const newUser = await fn(axios, user, login, val, user?.languageSettings?.knownLanguageId);
  setSelectedLanguage(newUser.languageSettings?.targetLanguage ?? '');
    } catch (err) {
      console.error('Language switch error:', err);
    }
  }

  return (
    <div className="header-row">
      <div className="header-title">
        {!hideAppTitle && (
          <Link className="header-app-link" to="/home">Ayala's Language App</Link>
  ) || (user && user.languageSettings && (user.languageSettings.knownLanguageId ?? 0) > 0 && user.languageSettings.otherUserLanguages && user.languageSettings.otherUserLanguages.length > 0 && (
          <div className="header-input-cell">
            <select id="language-picker" className="header-select" value={String(selectedLanguageId)} onChange={onChangeLanguage} >
              <option key={user.languageSettings.targetLanguageId} value={user.languageSettings.targetLanguageId}>{user.languageSettings.targetLanguage}</option>
              {
                user.languageSettings.otherUserLanguages.map((lang: any) => {
                  return (
                    <option key={lang.languageId} value={lang.languageId}>
                      {lang.nativeName}
                    </option>
                  );
                })
              }
            </select>
          </div>
        ))}
      </div>

      <div className="header-profile-container"><div className="header-profile-name">{showLanguageNextToProfile ? `${selectedLanguage}, ` : ''}{user?.displayName}<div className="header-score" title="Total Score"><Volleyball /> {user?.languageSettings?.score}</div></div></div>
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
            <li className="menu-line"><Link to='/profile' className="menu-item">Profile</Link></li>
            <li className="menu-line"><Link to='/change-password' className="menu-item">Change Password</Link></li>
            <hr className="menu-delimiter" />
            <li className="menu-line"><button onClick={logoutAction} className="menu-item">Logout</button></li>
          </ul>
        </div>
      )}
    </div>
  );
}
