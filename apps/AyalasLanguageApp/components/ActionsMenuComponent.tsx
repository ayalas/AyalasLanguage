import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { RelativePathString, useRouter } from 'expo-router';
import { Pressable, StyleProp, Text, TextStyle, View } from 'react-native';
import { Menu, Divider } from 'react-native-paper';
import useTextStyles from '@/lib/useTextStyles';

export interface ActionsMenuItem {
    isVisible?: boolean;
    disabled?: boolean;
    toPath?: string;
    onClick?: () => void;
    dataTestId: string;
    className?: string;
    itemText: string;
    titleStyle?: StyleProp<TextStyle>
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
        <View className='bg-brand-bgSurface w-full'>
            <Menu
                visible={menuVisible}
                onDismiss={closeMenu}
                /* style={{ width: '100%' }} */
                /* contentStyle={{  }} */
                anchor={
                    <Pressable
                        onPress={openMenu}
                        className="actions-menu-link-button">
                        <View className='flex-row items-center justify-center'>
                            <Text style={styles.text}>{anchorTitle} </Text>
                            <ChevronDown size={20} color="black" />
                        </View>
                    </Pressable>
                }
            >
                {items.map((item, index) => {
                    const isVisible = item.isVisible !== false;
                    if (!isVisible) return null;

                    countShown++;

                    return (
                        <View key={`menu-item-${index}`} className={`${item.className} bg-brand-bgSurface`}>
                            {/* Logic: Show separator before every item EXCEPT the first visible one */}
                            {countShown > 1 && <Divider />}

                            <Menu.Item
                                onPress={() => {
                                    itemSelect(item);
                                    closeMenu();
                                }}
                                title={item.itemText}
                                style={{ width: '100%' }} 
                                titleStyle={[styles.text, item.titleStyle]}
                            />
                        </View>
                    );
                })}
            </Menu>
        </View>
    )
}