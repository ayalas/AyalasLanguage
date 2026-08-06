import { useImperativeHandle, useState } from "react";
import { ArchiveRestore, Trash2 } from "lucide-react-native";
import useTextStyles from "@/lib/useTextStyles";
import { Text, TouchableOpacity, View } from "react-native";


export interface AlternativeHandle {
    exists: () => boolean;
}

export function AlternativeLine({ alternative, ref }: { alternative: string, ref: React.Ref<AlternativeHandle> }) {
    const [exists, setExists] = useState(true);
    const { styles } = useTextStyles();

    function onDeleteClick() {
        setExists(!exists);
    }

    useImperativeHandle(ref, () => ({
        exists() {
            return exists;
        }
    }));

    return (
        <View className="line-container">

            <TouchableOpacity testID="delete-or-restore" className="button-item"
                onPress={onDeleteClick}>
                {exists && (
                    <Trash2 width="18" height="18" className="color-brand-primary" />
                ) || (
                        <ArchiveRestore width="18" height="18" className="color-brand-primary" />
                    )}
            </TouchableOpacity>
            <Text numberOfLines={1} style={[styles.text, { flexShrink: 1, marginLeft: 10 }, exists ? { textDecorationLine: 'none' } : { textDecorationLine: 'line-through' }]}>{alternative}</Text>
        </View>
    );
}