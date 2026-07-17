import { ChevronDown } from 'lucide-react-native';
import { Fragment } from 'react';
import { RelativePathString, useRouter } from 'expo-router';
import { Text } from 'react-native';
import * as DropdownMenu from 'zeego/dropdown-menu';

export interface ActionsMenuItem {
    isVisible?: boolean;
    disabled?: boolean;
    toPath?: string;
    onClick?: () => void;
    dataTestId: string;
    className?: string;
    children: React.ReactNode;
}

export function ActionsMenuComponent({ items, anchorTitle }: { items: ActionsMenuItem[], anchorTitle: string }) {
    const router = useRouter();

    let countShown = 0;

    function itemSelect(item: ActionsMenuItem) {
        if (item.toPath != null) {
            router.replace(item.toPath as RelativePathString);
        }
        else if (item.onClick != null && !item.disabled) {
            item.onClick();
        }
    }

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger className='actions-menu-link-button'>
                <Text className="text">{anchorTitle}&nbsp;</Text><ChevronDown />
            </DropdownMenu.Trigger>

            <DropdownMenu.Content className="menu-container">
                {items.map((item, index) => {
                    const isVisible = item.isVisible !== false;
                    if (!isVisible) return null;
                    countShown++;
                    return (
                        <Fragment key={`actions-menu-item-fragment-${item.dataTestId}-${index}`}>
                            {countShown > 1 && (
                                <DropdownMenu.Separator className="menu-delimiter" />
                            )}
                            <DropdownMenu.Item key={`actions-menu-item-${item.dataTestId}-${index}`} className="menu-line"
                                onSelect={() => itemSelect(item)}>
                                <DropdownMenu.ItemTitle className={item.className != null ? `actions-menu-item ${item.className}` : "actions-menu-item"}>{item.children}</DropdownMenu.ItemTitle>
                            </DropdownMenu.Item>
                        </Fragment>
                    );
                })}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    )
}