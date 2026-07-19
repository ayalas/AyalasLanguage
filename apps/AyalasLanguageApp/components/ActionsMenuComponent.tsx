import { ChevronDown } from 'lucide-react-native';
import { Fragment, useState } from 'react';
import { RelativePathString, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Menu, Divider, PaperProvider, IconButton } from 'react-native-paper';
import useTextStyles from '@/lib/useTextStyles';

export interface ActionsMenuItem {
    isVisible?: boolean;
    disabled?: boolean;
    toPath?: string;
    onClick?: () => void;
    dataTestId: string;
    className?: string;
    itemText: string;
}

export function ActionsMenuComponent({ items, anchorTitle }: { items: ActionsMenuItem[], anchorTitle: string }) {
    const router = useRouter();
    const { styles } = useTextStyles();
    const [menuVisible, setMenuVisible] = useState(false);

    const openMenu = () => setMenuVisible(true);
    const closeMenu = () => setMenuVisible(false);

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
        <View>
            <Menu
                visible={menuVisible}
                onDismiss={closeMenu}
                anchor={
                    <Pressable
                        onPress={openMenu}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                        <Text style={styles.text}>{anchorTitle} </Text>
                        <ChevronDown size={20} color="black" />
                    </Pressable>
                }
            >
                {items.map((item, index) => {
                    const isVisible = item.isVisible !== false;
                    if (!isVisible) return null;

                    countShown++;

                    return (
                        <Fragment key={`menu-item-${index}`}>
                            {/* Logic: Show separator before every item EXCEPT the first visible one */}
                            {countShown > 1 && <Divider />}

                            <Menu.Item
                                onPress={() => {
                                    itemSelect(item);
                                    closeMenu();
                                }}
                                title={item.itemText}
                                // Convert your className logic to titleStyle or contentStyle
                                titleStyle={{ color: item.className?.includes('danger') ? 'red' : 'black' }}
                            />
                        </Fragment>
                    );
                })}
            </Menu>
        </View>
    )
}