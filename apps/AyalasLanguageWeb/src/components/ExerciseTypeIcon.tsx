import type { ExerciseType } from "@ayalaslanguage/types/exercise";
import { hasMultiBucketAnswers, hasSingleBucketAnswer, isMatchingType, usesInlineExerciseWithBlanks, writingExercise } from "../logic/ExerciseTypeLogic";
import { PencilSparkles, PenLine, Tally1, Tally2, Tally4 } from "lucide-react";

export function ExerciseTypeIcon({ exerciseTypeId }: { exerciseTypeId: 0 | ExerciseType }) {
    return (
        <>
            {writingExercise(exerciseTypeId) && (
                <PenLine />
            ) || isMatchingType(exerciseTypeId) && (
                <Tally2 />
            ) || hasMultiBucketAnswers(exerciseTypeId) && (
                <Tally4 />
            ) || hasSingleBucketAnswer(exerciseTypeId) && (
                <Tally1 />
            ) || usesInlineExerciseWithBlanks(exerciseTypeId) && (
                <PencilSparkles />
            )}
        </>
    );
}