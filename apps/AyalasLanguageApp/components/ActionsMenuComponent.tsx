import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { RelativePathString, useRouter } from 'expo-router';
import { Pressable, StyleProp, Text, TextStyle, View } from 'react-native';
import { Menu, Divider } from 'react-native-paper';
import useTextStyles from '@/lib/useTextStyles';
import { SURFACE_STRONG_DARK, SURFACE_STRONG_LIGHT, PRIMARY_DARK, PRIMARY_LIGHT } from '@/constants';

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
    const { styles, isDark } = useTextStyles();
    const [menuVisible, setMenuVisible] = useState(false);

    // Track the width of the anchor to make the menu match it
    const [menuWidth, setMenuWidth] = useState<number | undefined>(undefined);

    const onLayout = (event: any) => {
        const { width } = event.nativeEvent.layout;
        setMenuWidth(width);
    };

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
        <View 
            className='w-full' 
            onLayout={onLayout} // Measure the available width
        >
            <Menu
                visible={menuVisible}
                onDismiss={closeMenu}
                // contentStyle ensures the dropdown itself matches the anchor width
                contentStyle={{ width: menuWidth, backgroundColor: isDark ? SURFACE_STRONG_DARK : SURFACE_STRONG_LIGHT  }} 
                anchor={
                    <Pressable
                        onPress={openMenu}
                        // Ensure the pressable fills the container
                        style={{ width: '100%' }}
                        className="actions-menu-link-button">
                        <View className='flex-row items-center justify-center'>
                            <Text style={styles.text}>{anchorTitle} </Text>
                            <ChevronDown size={20} color={isDark ? PRIMARY_DARK : PRIMARY_LIGHT} />
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
                            {countShown > 1 && <Divider />}
                            <Menu.Item
                                onPress={() => {
                                    itemSelect(item);
                                    closeMenu();
                                }}
                                title={item.itemText}
                                
                                titleStyle={[styles.text, item.titleStyle]}
                            />
                        </View>
                    );
                })}
            </Menu>
        </View>
    );
}