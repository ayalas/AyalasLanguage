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
import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';

export interface ActionsMenuItem {
    isVisible?: boolean;
    disabled?: boolean;
    toPath?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    dataTestId: string;
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
    let countShown = 0;
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
                        {items.map((item, index) => {
                            const isVisible = item.isVisible !== false;
                            const isDisabled = item.disabled === true;
                            if (!isVisible) return null;
                            countShown++;

                            return (
                                <Fragment key={`actions-menu-item-fragment-${item.dataTestId}-${index}`}>
                                    {countShown > 1 && (
                                        <hr className="menu-delimiter" />
                                    )
                                    }
                                    <li key={`actions-menu-item-${item.dataTestId}-${index}`} className="menu-line">
                                        {item.toPath != null && (
                                            <Link data-testid={item.dataTestId} to={item.toPath}
                                                className={item.className != null ? `actions-menu-item ${item.className}` : "actions-menu-item"}>
                                                {item.children}
                                            </Link>
                                        ) || item.onClick != null && (
                                            <button data-testid={item.dataTestId} type="button" disabled={isDisabled} onClick={(e) => {
                                                e.preventDefault();
                                                item.onClick && item.onClick(e);
                                                setIsOpen(false);
                                            } }
                                                className={item.className != null ? `actions-menu-item ${item.className}` : "actions-menu-item"}>
                                                {item.children}
                                            </button>
                                        )
                                        }
                                    </li>
                                </Fragment>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}