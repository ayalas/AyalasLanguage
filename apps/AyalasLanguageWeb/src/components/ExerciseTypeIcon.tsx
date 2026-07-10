import type { ExerciseType } from "@ayalaslanguage/types/exercise";
import { EXERCISE_TYPE_LOGIC } from "../logic/ExerciseTypeLogic";
import { PencilSparkles, PenLine, Tally1, Tally2, Tally4 } from "lucide-react";

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