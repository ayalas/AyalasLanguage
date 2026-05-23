import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
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
    const { user } = useOutletContext();

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

    return (
        <div className="header-row">
            {/* Trigger Button */}
            <button
                ref={setReference}
                {...getReferenceProps()}
                className="menu-button"
            >
                {user.displayName}
            </button>

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
                        <li className="menu-line"><button onClick={() => alert('Profile')} className="menu-item">Profile</button></li>
                        <li className="menu-line"><button onClick={() => alert('Change Password')} className="menu-item">Change Password</button></li>
                        <hr className="menu-delimiter" />
                        <li className="menu-line"><button onClick={() => alert('Logout')} className="menu-item">Logout</button></li>
                    </ul>
                </div>
            )}
        </div>
    );
}