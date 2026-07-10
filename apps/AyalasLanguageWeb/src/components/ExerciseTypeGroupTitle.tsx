import type { ExerciseType } from "@ayalaslanguage/types/exercise";
import { ExerciseTypeIcon } from "./ExerciseTypeIcon";
import { EXERCISE_TYPE_LOGIC } from "../logic/ExerciseTypeLogic";

export function ExerciseTypeGroupTitle({ exerciseTypeId }: { exerciseTypeId: 0 | ExerciseType }) {
    return (
        <div className="learning-exercise-type-heading">
            {EXERCISE_TYPE_LOGIC[exerciseTypeId].Name}
            <div className="learning-exercise-type-heading-icon">
                <ExerciseTypeIcon exerciseTypeId={exerciseTypeId} />
            </div>
            </div>
    );
}