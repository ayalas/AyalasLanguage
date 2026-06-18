export const EXERCISE_TYPES =
  {
    FROM_KNOWN_TO_TARGET: 1,
    FROM_TARGET_TO_KNOWN: 2,
    FILL_IN_THE_BLANKS: 3,
    MATCHING: 4,
    FROM_KNOWN_TO_TARGET_BUCKET: 5,
    COMMON_RESPONSES_BUCKET: 6,
    COMMON_RESPONSES: 7
  } as const;

export type ExerciseType = typeof EXERCISE_TYPES[keyof typeof EXERCISE_TYPES];

export const TWO_FACTOR_CODE_LENGTH = 6;

export const AUTHOR_ACCESS = 
{
    LEARNER: 1,
    CAN_EDIT: 2
} as const;

export const ROLE_TYPE = 
{
    LEARNER: 1,
    CONTENT_CREATOR: 2,
    ADMIN: 3
} as const;

export const PAGE_SIZE = 2;