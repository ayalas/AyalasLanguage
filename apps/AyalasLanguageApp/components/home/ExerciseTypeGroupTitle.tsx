import type { ExerciseType } from "@ayalaslanguage/types/exercise";
import { ExerciseTypeIcon } from "./ExerciseTypeIcon";
import { EXERCISE_TYPE_LOGIC } from "@ayalaslanguage/types/sharedfrontlib/logic";
import { View, Text } from "react-native";
import useTextStyles from "@/lib/useTextStyles";

export function ExerciseTypeGroupTitle({ exerciseTypeId }: { exerciseTypeId: 0 | ExerciseType }) {
    const styles = useTextStyles();
    
    return (
        <View className="home-header-row">
            <Text style={styles.italicHeading}>{EXERCISE_TYPE_LOGIC[exerciseTypeId].Name}</Text>
            <View className="learning-exercise-type-heading-icon">
                <ExerciseTypeIcon exerciseTypeId={exerciseTypeId} />
            </View>
        </View>
    );
}