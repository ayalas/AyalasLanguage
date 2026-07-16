import type { ExerciseType } from "@ayalaslanguage/types/exercise";
import { ExerciseTypeIcon } from "./ExerciseTypeIcon";
import { EXERCISE_TYPE_LOGIC } from "@ayalaslanguage/types/sharedfrontlib/logic";
import { View, Text } from "react-native";

export function ExerciseTypeGroupTitle({ exerciseTypeId }: { exerciseTypeId: 0 | ExerciseType }) {
    return (
        <View className="home-header-row">
            <Text className="text learning-exercise-type-heading">{EXERCISE_TYPE_LOGIC[exerciseTypeId].Name}</Text>
            <View className="learning-exercise-type-heading-icon">
                <ExerciseTypeIcon exerciseTypeId={exerciseTypeId} />
            </View>
        </View>
    );
}