import { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { SquareMenu } from 'lucide-react';
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

export function AuthHeader({ hideAppTitle }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLanguageId, setSelectedLanguageId] = useState("");
    const [selectedLanguage, setSelectedLanguage] = useState("");
    const [showLanguageNextToProfile, setShowLanguageNextToProfile] = useState(!hideAppTitle);
    const { user, logout, login } = useOutletContext();
    const navigate = useNavigate();

    useEffect(() => {
        const loadLanguage = async function () {
            if (!user || !user.languageSettings) {
                return;
            }
            if (user.languageSettings.targetLanguageId != null) {
                setSelectedLanguageId(user.languageSettings.targetLanguageId);
                setSelectedLanguage(user.languageSettings.targetLanguage);

                if (!showLanguageNextToProfile && (!user.languageSettings.otherUserLanguages
                    || user.languageSettings.otherUserLanguages.length == 0)) {
                    setShowLanguageNextToProfile(true);
                }
            }
            else {
                setShowLanguageNextToProfile(false);
            }
        };
        loadLanguage();
    }, [user]);

    // 1. Positioning Config
    const { refs: { setFloating, setReference }, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: 'bottom-start', // Default layout location
        whileElementsMounted: autoUpdate, // Crucial for updating position on scroll
        middleware: [
            offset(8), // Pushes menu 8px away from the trigger button
            flip(),    // Flips to top if crowded at the bottom viewport edge
            shift()    // Shifts horizontally to prevent sidebar clipping
        ],
    });

    // 2. Interaction Config (Clicks, Esc key, Outside Clicks)
    const click = useClick(context);
    const dismiss = useDismiss(context, {
        outsidePress: true, // Closes on outside click
    });

    // 3. Merging interactions into simple prop getters
    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

    const logoutAction = async function () {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (response.ok) {
            logout();
            navigate(`/`); // Update global auth context state
        } else {
            alert(`${response.statusText} (${response.status})`);
        }
    }

    async function onChangeLanguage(e) {
        e.preventDefault();
        try {
            setSelectedLanguageId(e.target.value);
            const newUser = await switchLanguage(axios, user, login, Number(e.target.value), user.languageSettings.knownLanguageId);
            setSelectedLanguage(newUser.languageSettings.targetLanguage);
        } catch (err) {
            console.error('Language switch error:', err);
        }
    }

    return (
        <div className="header-row">

            <div className="header-title">
                {!hideAppTitle && (
                    <Link className="header-app-link" to="/home">Ayala's Language App</Link>
                ) || (user && user.languageSettings && user.languageSettings.knownLanguageId > 0 && user.languageSettings.otherUserLanguages && user.languageSettings.otherUserLanguages.length > 0 && (
                    <div className="header-input-cell">
                        <select id="language-picker" className="header-select" value={selectedLanguageId} onChange={onChangeLanguage} >
                            <option key={user.languageSettings.targetLanguageId} value={user.languageSettings.targetLanguageId}>{user.languageSettings.targetLanguage}</option>
                            {
                                user.languageSettings.otherUserLanguages.map((lang) => {
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

            {/* Trigger Button */}
            <div className="header-profile-name">{showLanguageNextToProfile ? `${selectedLanguage}, ` : ""}{user.displayName}</div>
            <Link ref={setReference}
                {...getReferenceProps()}>
                <SquareMenu />
            </Link>

            {/* Absolutely Positioned Flyout Menu Panel */}
            {isOpen && (
                <div className="menu-container"
                    ref={setFloating}
                    style={{
                        ...floatingStyles // Automatically applies dynamic top/left/transform styles
                    }}
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