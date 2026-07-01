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
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export interface ActionsMenuItem {
    isVisible: boolean;
    toPath?: string;
    onClick?: () => void;
    dataTestId: string;
    prefixWithSeparator?: boolean;
    className?: string;
    children: React.ReactNode;
}

export function ActionsMenuComponent({ items, anchorTitle }: { items: ActionsMenuItem[], anchorTitle: string }) {
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
        <div className="form-button-cell">
            <Link data-testid="more-actions" ref={setReference as any} {...getReferenceProps()} className="actions-menu-link-button" to="#">
                {anchorTitle}&nbsp;<ChevronDown />
            </Link>

            {isOpen && (
                <div className="menu-container"
                    ref={setFloating}
                    style={{ ...floatingStyles }}
                    {...getFloatingProps()}>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {items.map((item, index) => (
                            item.isVisible && (
                                <>
                                    {item.prefixWithSeparator && (
                                        <hr className="menu-delimiter" />
                                    )
                                    }
                                    <li key={index} className="menu-line">
                                        {item.toPath != null && (
                                            <Link data-testid={item.dataTestId} to={item.toPath}
                                                className={item.className != null ? `actions-menu-item ${item.className}` : "actions-menu-item"}>
                                                {item.children}
                                            </Link>
                                        ) || item.onClick != null && (
                                            <button data-testid={item.dataTestId} type="button" onClick={item.onClick}
                                                className={item.className != null ? `actions-menu-item ${item.className}` : "actions-menu-item"}>
                                                {item.children}
                                            </button>
                                        )
                                        }
                                    </li>
                                </>)
                        )
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}