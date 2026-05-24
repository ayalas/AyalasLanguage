import { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { SquareMenu } from 'lucide-react';
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

export function AuthHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState("");
    const { user, logout } = useOutletContext();
    const navigate = useNavigate();

    useEffect(() => {
        const loadLanguage = async function() {
            if (user.languageSettings.targetLanguageId != null) {
                setSelectedLanguage(user.languageSettings.targetLanguage);
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
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            logout();
            navigate(`/`); // Update global auth context state
        } else {
            alert(`${response.statusText} (${response.status})`);
        }
    }

    return (
        <div className="header-row">
            <div className="header-title">
                <Link className="header-app-link" to="/home">Ayala's Language App</Link>
            </div>
            {/* Trigger Button */}
            <div className="header-profile-name">{selectedLanguage}, {user.displayName}</div>
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