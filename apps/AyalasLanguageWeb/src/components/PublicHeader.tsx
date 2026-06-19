import { Link } from 'react-router-dom';
import imgLogo from '../assets/logo.jpg';
import { Mail, SquareMenu } from 'lucide-react';
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
import { BRAND_NAME } from '../constants/public';
import { useState } from 'react';



export function PublicHeader() {
    const [isOpen, setIsOpen] = useState(false);

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

    return (
        <div className="header-row">
            <div className="header-title">
                <Link className="header-app-link" to="/home"><img className="logo" src={imgLogo} /></Link>
            </div>
            <div className="header-links">
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
                            <li className="menu-line"><Link to='/home' className="menu-item">To the app</Link></li>
                            <li className="menu-line"><div className="menu-item"><div className="header-link"><Link to='/contactus' className="header-link-item"><Mail /> Contact Us</Link></div></div></li>
                            <li className="menu-line"><Link to='/about' className="menu-item">About {BRAND_NAME}</Link></li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
