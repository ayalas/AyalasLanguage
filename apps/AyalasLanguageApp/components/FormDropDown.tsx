import React, { useState } from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import DropDownPicker, { ItemType, ValueType } from 'react-native-dropdown-picker';
import useTextStyles from '@/lib/useTextStyles';
import { 
    BORDER_DARK, 
    BORDER_LIGHT, 
    PRIMARY_DARK, 
    PRIMARY_LIGHT, 
    SURFACE_STRONG_DARK, 
    SURFACE_STRONG_LIGHT 
} from '@/constants';

interface FormDropDownProps {
    value: ValueType | null;
    setValue: React.Dispatch<React.SetStateAction<any>>;
    items: ItemType<ValueType>[];
    onChangeValue?: (value: ValueType | null) => void;
    zIndex?: number;
    placeholder?: string;
}

const FormDropDown = ({ 
    value, 
    setValue, 
    items, 
    onChangeValue, 
    zIndex, 
    placeholder 
}: FormDropDownProps) => {
    const [open, setOpen] = useState(false);
    const { styles, isDark } = useTextStyles();

    // Internal Icon Components to keep the main file clean
    const IconUp = ({ style }: { style: StyleProp<ViewStyle> }) => (
        <View style={style}>
            <Text style={{ color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT }}>▲</Text>
        </View>
    );

    const IconDown = ({ style }: { style: StyleProp<ViewStyle> }) => (
        <View style={style}>
            <Text style={{ color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT }}>▼</Text>
        </View>
    );

    const IconTick = ({ style }: { style: StyleProp<ViewStyle> }) => (
        <View style={style}>
            <Text style={{ 
                color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT, 
                fontWeight: 'bold', 
                fontSize: 18 
            }}>✓</Text>
        </View>
    );

    return (
        <DropDownPicker
            open={open}
            value={value}
            items={items}
            setOpen={setOpen}
            setValue={setValue}
            onChangeValue={onChangeValue}
            placeholder={placeholder}
            listMode="SCROLLVIEW"
            multiple={false}
            zIndex={zIndex}
            
            // Custom Icons
            ArrowUpIconComponent={IconUp}
            ArrowDownIconComponent={IconDown}
            TickIconComponent={IconTick}

            // Styles
            style={{
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: isDark ? BORDER_DARK : BORDER_LIGHT,
                backgroundColor: 'transparent',
                minHeight: 50,
            }}
            textStyle={[styles.text, { paddingTop: 10 }]}
            dropDownContainerStyle={{
                backgroundColor: isDark ? SURFACE_STRONG_DARK : SURFACE_STRONG_LIGHT,
                borderColor: isDark ? BORDER_DARK : BORDER_LIGHT,
            }}
            listItemContainerStyle={{ 
                backgroundColor: isDark ? SURFACE_STRONG_DARK : SURFACE_STRONG_LIGHT 
            }}
        />
    );
};

export default FormDropDown;