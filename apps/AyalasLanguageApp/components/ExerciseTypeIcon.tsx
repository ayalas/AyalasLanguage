import type { ExerciseType } from "@ayalaslanguage/types/exercise";
import { EXERCISE_TYPE_LOGIC } from "@ayalaslanguage/types/sharedfrontlib/logic";
import { PencilSparkles, PenLine, Tally1, Tally2, Tally4 } from "lucide-react-native";

export function ExerciseTypeIcon({ exerciseTypeId }: { exerciseTypeId: 0 | ExerciseType }) {
    return (
        <>
            {EXERCISE_TYPE_LOGIC[exerciseTypeId].IsWritingExercise && (
                <PenLine className="color-brand-primary" />
            ) ||
                EXERCISE_TYPE_LOGIC[exerciseTypeId].IsMatchingType && (
                    <Tally2 className="color-brand-primary" />
                ) || EXERCISE_TYPE_LOGIC[exerciseTypeId].HasMultiBucketAnswers && (
                    <Tally4 className="color-brand-primary" />
                ) || EXERCISE_TYPE_LOGIC[exerciseTypeId].HasSingleBucketAnswer && (
                    <Tally1 className="color-brand-primary" />
                ) || EXERCISE_TYPE_LOGIC[exerciseTypeId].UsesInlineExerciseWithBlanks && (
                    <PencilSparkles className="color-brand-primary" />
                )}
        </>
    );
}