export const EXERCISE_TYPES =
  {
    FROM_KNOWN_TO_TARGET: 1,
    FROM_TARGET_TO_KNOWN: 2,
    FILL_IN_THE_BLANKS: 3,
    MATCHING: 4,
    FROM_KNOWN_TO_TARGET_BUCKET: 5,
    COMMON_RESPONSES_BUCKET: 6,
    COMMON_RESPONSES: 7,
    FROM_TARGET_TO_KNOWN_BUCKET: 8,
    MATCHING_TO_SPOKEN: 9
  } as const;

export type ExerciseType = typeof EXERCISE_TYPES[keyof typeof EXERCISE_TYPES];

export const CONTENT_STATUS =
  {
    DRAFT: 0,
    APPROVED: 1,
    REMOVED: 2
  } as const;

export type ContentStatus = typeof CONTENT_STATUS[keyof typeof CONTENT_STATUS];