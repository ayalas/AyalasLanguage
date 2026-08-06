import useTextStyles from '@/lib/useTextStyles';
import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';

type Props = {
  itemValue: string;
  position: number;
  isRTL: boolean;
  itemClicked: (val: string, pos: number) => void;
};

export default function BucketListItem({ itemValue, position, isRTL, itemClicked }: Props) {
  const { styles } = useTextStyles();
  
  function clickButton() {
    itemClicked(itemValue, position);
  }

  return (
    <View className="bucket-list-item-cell">
      <TouchableOpacity testID="click-button" className="bucket-list-item-button" onPress={clickButton}>
        <Text textBreakStrategy="simple" style={[styles.exerciseText, { flexShrink: 1, 
          flexWrap: 'wrap', display: 'flex', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{itemValue}</Text>
      </TouchableOpacity>
    </View>
  );
};
