import { LOG_TYPE, type LogType } from "@ayalaslanguage/types/log";

export const LOG_TYPE_MAPPING = {
  [LOG_TYPE.AUTO_AI_FAILURE]: "Auto AI Failure"
} as const;

export interface IRowContactUs
{
    contactUsId: number,    
    userId?: number,
    displayName?: string,
    email: string,
    message: string,
    createdOn: string
}

export interface IRowLog
{
    logId: number,    
    userId?: number,
    email: string,
    logType: LogType,
    description: string,
    createdOn: string
}

export interface AdminGridResponse<T> {
  numOfRecords: number;
  data: T[];
}
