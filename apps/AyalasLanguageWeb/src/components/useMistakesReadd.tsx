import { errorHandler } from "@ayalaslanguage/types/error";
import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";

interface MistakesReaddProps
{
    learningPathId?: number;
    exerciseId?: number;
    setError: (arg: string) => void;
    initialValue?: boolean;
}

export function useMistakesReadd({learningPathId, exerciseId, setError, initialValue}: MistakesReaddProps) {
    const [practiseMistakesInThisPath, setPractiseMistakesInThisPath] = useState(initialValue ?? false);

    const changeMistakesSetting = async function (readd: boolean) {
        try {
            if (exerciseId == null || learningPathId == null) return;
            await axios.post('/api/learning/progress', {
                learningPathId: learningPathId,
                exerciseId: exerciseId,
                practiseMistakesInThisPath: readd
            });

            setPractiseMistakesInThisPath(readd);
        } catch (err: unknown) {
            errorHandler(err, setError);
        }
    };
    const readdMistakes = function () {

        // 1. Trigger the toast
        const toastId = toast('Are you sure you want to readd your mistakes here?', {
            description: 'Every time you make a mistake, a duplicate of the exercise you made a mistake in will be added to this lesson. If you have set this setting to another lesson already, it will be removed from it. Typically, this setting should be applied to the bottom most lesson in the homepage.',
            action: {
                label: 'Yes, readd my mistakes here',
                onClick: (e) => {
                    e.preventDefault();
                    changeMistakesSetting(true);
                    toast.dismiss(toastId);
                },
            },
            cancel: {
                label: 'Cancel',
                onClick: (e) => {
                    e.preventDefault();
                    toast.dismiss(toastId);
                }
            },
            classNames: {
                toast: 'my-confirm-toast',
                description: 'my-confirm-description', // Optional: styling the description
                actionButton: 'my-action-btn', // Makes the button full width at the bottom
                cancelButton: 'my-cancel-btn',
            },
        });
    };

    const cancelMistakesAdd = function () {
        changeMistakesSetting(false);
    };

    return { practiseMistakesInThisPath, setPractiseMistakesInThisPath, readdMistakes, cancelMistakesAdd };

}