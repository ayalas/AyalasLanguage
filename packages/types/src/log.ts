export const LOG_TYPE =
  {
    AUTO_AI_FAILURE: 1
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