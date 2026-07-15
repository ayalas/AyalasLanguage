import type { ExerciseType } from "@ayalaslanguage/types/exercise";
import { EXERCISE_TYPE_LOGIC } from "@ayalaslanguage/types/sharedfrontlib/logic";
import { PencilSparkles, PenLine, Tally1, Tally2, Tally4 } from "lucide-react-native";

export function ExerciseTypeIcon({ exerciseTypeId }: { exerciseTypeId: 0 | ExerciseType }) {
    return (
        <>
            {EXERCISE_TYPE_LOGIC[exerciseTypeId].IsWritingExercise && (
                <PenLine />
            ) ||
                EXERCISE_TYPE_LOGIC[exerciseTypeId].IsMatchingType && (
                    <Tally2 />
                ) || EXERCISE_TYPE_LOGIC[exerciseTypeId].HasMultiBucketAnswers && (
                    <Tally4 />
                ) || EXERCISE_TYPE_LOGIC[exerciseTypeId].HasSingleBucketAnswer && (
                    <Tally1 />
                ) || EXERCISE_TYPE_LOGIC[exerciseTypeId].UsesInlineExerciseWithBlanks && (
                    <PencilSparkles />
                )}
        </>
    );
}