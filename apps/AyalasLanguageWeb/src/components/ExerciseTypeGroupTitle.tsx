import type { ExerciseType } from "@ayalaslanguage/types/exercise";
import { EXERCISE_TYPE_NAME_MAPPING } from "../constants/learning";
import { hasMultiBucketAnswers, hasSingleBucketAnswer, isMatchingType, usesInlineExerciseWithBlanks, writingExercise } from "../logic/ExerciseTypeLogic";
import { PencilSparkles, PenLine, Tally1, Tally2, Tally4 } from "lucide-react";

export function ExerciseTypeGroupTitle({ exerciseTypeId }: { exerciseTypeId: 0 | ExerciseType }) {
    return (
        <div className="learning-exercise-type-heading">
            {EXERCISE_TYPE_NAME_MAPPING[exerciseTypeId]}
            <div className="learning-exercise-type-heading-icon">
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
            </div>
            </div>
    );
}