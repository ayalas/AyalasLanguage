import { errorHandler } from "@ayalaslanguage/types/error";
import api from "@/lib/api";
import { useState } from "react";
import { Alert, Platform } from 'react-native';

interface MistakesReaddProps {
    learningPathId?: number;
    exerciseId?: number;
    setError: (arg: string) => void;
    initialValue?: boolean;
}

export function useMistakesReadd({ learningPathId, exerciseId, setError, initialValue }: MistakesReaddProps) {
    const [practiseMistakesInThisPath, setPractiseMistakesInThisPath] = useState(initialValue ?? false);

    const changeMistakesSetting = async function (readd: boolean) {
        try {
            if (learningPathId == null) return;

            const postData: any = {
                learningPathId: learningPathId,
                practiseMistakesInThisPath: readd
            };
            if (exerciseId != null) {
                postData.exerciseId = exerciseId;
            }
            await api.post('/api/learning/progress', postData);

            setPractiseMistakesInThisPath(readd);
        } catch (err: unknown) {
            errorHandler(err, setError);
        }
    };
    const readdMistakes = function () {
        const title = "Are you sure you want to readd your mistakes here?";
        const message = "Every time you make a mistake, a duplicate of the exercise you made a mistake in will be added to this lesson. If you have set this setting to another lesson already, it will be removed from it. Typically, this setting should be applied to the bottom most lesson in the homepage.";
        if (Platform.OS === 'web') {
            // browser window.confirm returns true for "OK" and false for "Cancel"
            const result = window.confirm(`${title}\n\n${message}`);
            if (result) {
                changeMistakesSetting(true);
            }
        } else {
            return Alert.alert(
                title,
                message,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Yes, readd my mistakes here",
                        onPress: () => {
                            changeMistakesSetting(true);
                        },
                        style: "destructive"
                    },
                ]
            );
        }
    };

    const cancelMistakesAdd = function () {
        changeMistakesSetting(false);
    };

    return { practiseMistakesInThisPath, setPractiseMistakesInThisPath, readdMistakes, cancelMistakesAdd };

}