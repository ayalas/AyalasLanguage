import type { ExerciseType } from "@ayalaslanguage/types/exercise";
import { EXERCISE_TYPE_NAME_MAPPING } from "../constants/learning";
import { ExerciseTypeIcon } from "./ExerciseTypeIcon";

export function ExerciseTypeGroupTitle({ exerciseTypeId }: { exerciseTypeId: 0 | ExerciseType }) {
    return (
        <div className="learning-exercise-type-heading">
            {EXERCISE_TYPE_NAME_MAPPING[exerciseTypeId]}
            <div className="learning-exercise-type-heading-icon">
                <ExerciseTypeIcon exerciseTypeId={exerciseTypeId} />
            </div>
            </div>
    );
}