export const LOG_TYPE =
  {
    AUTO_AI_FAILURE: 1,
    EXERCISE_DATA_VALIDATION_FAILED: 2,
    USERS_PROGRESS_UPDATE_ON_EXERCISE_CREATE_JOB_RUN_FAILED: 3
  } as const;

export type LogType = typeof LOG_TYPE[keyof typeof LOG_TYPE];

export interface CreateLogRequest {
  LogType: LogType;
  Description: string;
}

export interface LogAutoAIFailure
{
  Title: string,
  Instruction: string,
  Result: string
}