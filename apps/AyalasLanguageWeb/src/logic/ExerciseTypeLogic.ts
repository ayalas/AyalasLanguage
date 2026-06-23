import { EXERCISE_TYPES, type ExerciseType } from "@ayalaslanguage/types/exercise";

export const supportsAlternativeAnswers = (type: ExerciseType | 0): boolean => {
    return ([
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET,
        EXERCISE_TYPES.FROM_TARGET_TO_KNOWN,
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET,
        EXERCISE_TYPES.COMMON_RESPONSES,
        EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET
    ] as (ExerciseType | 0)[]).includes(type);
};

export const showCheckAnswers = (type: ExerciseType | 0): boolean => {
    return ([
        EXERCISE_TYPES.COMMON_RESPONSES,
        EXERCISE_TYPES.FILL_IN_THE_BLANKS,
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET,
        EXERCISE_TYPES.FROM_TARGET_TO_KNOWN,
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET,
        EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET
    ] as (ExerciseType | 0)[]).includes(type);
};

export const canRevealAnswers = (type: ExerciseType | 0): boolean => {
    return ([
        EXERCISE_TYPES.COMMON_RESPONSES,
        EXERCISE_TYPES.FILL_IN_THE_BLANKS,
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET,
        EXERCISE_TYPES.FROM_TARGET_TO_KNOWN,
        EXERCISE_TYPES.COMMON_RESPONSES_BUCKET,
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET,
        EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET
    ] as (ExerciseType | 0)[]).includes(type);
};

export const showTranslationOnRevealedAnswer = (type: ExerciseType | 0): boolean => {
    return ([
        EXERCISE_TYPES.COMMON_RESPONSES,
        EXERCISE_TYPES.FILL_IN_THE_BLANKS,
        EXERCISE_TYPES.COMMON_RESPONSES_BUCKET
    ] as (ExerciseType | 0)[]).includes(type);
};

export const isMatchingType = (type: ExerciseType | 0): boolean => {
    return ([
        EXERCISE_TYPES.MATCHING
    ] as (ExerciseType | 0)[]).includes(type);
};

export const focusOnLoad = (type: ExerciseType | 0): boolean => {
    return ([
        EXERCISE_TYPES.COMMON_RESPONSES,
        EXERCISE_TYPES.FILL_IN_THE_BLANKS,
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET,
        EXERCISE_TYPES.FROM_TARGET_TO_KNOWN
    ] as (ExerciseType | 0)[]).includes(type);
};

export const shouldPlayQuestion = (type: ExerciseType | 0): boolean => {
    return ([
        EXERCISE_TYPES.COMMON_RESPONSES,
        EXERCISE_TYPES.COMMON_RESPONSES_BUCKET,
        EXERCISE_TYPES.FROM_TARGET_TO_KNOWN,
        EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET
    ] as (ExerciseType | 0)[]).includes(type);
};

export const isRightToLeftInput = (type: ExerciseType | 0, targetIsRtl: boolean, knownIsRtl: boolean): boolean => {
    return (([
        EXERCISE_TYPES.COMMON_RESPONSES,
        EXERCISE_TYPES.COMMON_RESPONSES_BUCKET,
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET,
        EXERCISE_TYPES.FILL_IN_THE_BLANKS,
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET
    ] as (ExerciseType | 0)[]).includes(type) && targetIsRtl) ||
    (([
        EXERCISE_TYPES.FROM_TARGET_TO_KNOWN,
        EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET
    ] as (ExerciseType | 0)[]).includes(type) && knownIsRtl);
};

export const shouldPlayAnswer = (type: ExerciseType | 0): boolean => {
    return ([
        EXERCISE_TYPES.COMMON_RESPONSES,
        EXERCISE_TYPES.FILL_IN_THE_BLANKS,
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET,
        EXERCISE_TYPES.COMMON_RESPONSES_BUCKET,
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET
    ] as (ExerciseType | 0)[]).includes(type);
};

export const useVirtualKeyboard = (type: ExerciseType | 0): boolean => {
    return ([
        EXERCISE_TYPES.COMMON_RESPONSES,
        EXERCISE_TYPES.FILL_IN_THE_BLANKS,
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET
    ] as (ExerciseType | 0)[]).includes(type);
};

export const hasExtraOptions = (type: ExerciseType | 0): boolean => {
    return ([
        EXERCISE_TYPES.COMMON_RESPONSES_BUCKET,
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET,
        EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET
    ] as (ExerciseType | 0)[]).includes(type);
};

export const hasSingleBucketAnswer = (type: ExerciseType | 0): boolean => {
    return ([
        EXERCISE_TYPES.COMMON_RESPONSES_BUCKET
    ] as (ExerciseType | 0)[]).includes(type);
};

export const hasMultiBucketAnswers = (type: ExerciseType | 0): boolean => {
    return ([
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET,
        EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET
    ] as (ExerciseType | 0)[]).includes(type);
};

export const usesInlineExerciseWithBlanks = (type: ExerciseType | 0): boolean => {
    return ([
        EXERCISE_TYPES.FILL_IN_THE_BLANKS
    ] as (ExerciseType | 0)[]).includes(type);
};

export const getExtraOptionsSeparator = (type: ExerciseType | 0): string => {
    switch (type) {
        case EXERCISE_TYPES.COMMON_RESPONSES_BUCKET: return ",";
        case EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET: return " ";
        case EXERCISE_TYPES.FROM_TARGET_TO_KNOWN_BUCKET: return " ";
        default:
            throw new Error(`Exercise type ${type} does not support separators.`);
    }
};

export const writingExercise = (type: ExerciseType | 0): boolean => {
    return ([
        EXERCISE_TYPES.FROM_KNOWN_TO_TARGET,
        EXERCISE_TYPES.FROM_TARGET_TO_KNOWN,
        EXERCISE_TYPES.COMMON_RESPONSES
    ] as (ExerciseType | 0)[]).includes(type);
};