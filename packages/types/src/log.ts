export const LOG_TYPES =
  {
    AUTO_AI_FAILURE: 1
  } as const;

export type LogType = typeof LOG_TYPES[keyof typeof LOG_TYPES];

export interface CreateLogRequest {
  LogType: LogType;
  Description: string;
}