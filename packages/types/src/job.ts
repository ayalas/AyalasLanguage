export const JOB_TYPE = {
    USERS_PROGRESS_ON_EXERCISE_CREATE: 1
} as const;

export type JobType = typeof JOB_TYPE[keyof typeof JOB_TYPE];

export const JOB_STATUS = {
    NotStarted: 0,
    Running: 1,
    Stopped: 2,
    Completed: 3,
    PartiallyFailed: 4,
    Failed: 5
} as const;

export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];