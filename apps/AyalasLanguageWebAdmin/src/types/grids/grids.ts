import { CONTENT_STATUS } from "@ayalaslanguage/types/exercise";
import { LOG_TYPE, type LogType } from "@ayalaslanguage/types/log";

export const LOG_TYPE_MAPPING = {
  [LOG_TYPE.AUTO_AI_FAILURE]: "Auto AI Failure"
} as const;

export const CONTENT_STATUS_MAPPING = {
  [CONTENT_STATUS.DRAFT]: "Draft",
  [CONTENT_STATUS.APPROVED]: "Approved",
  [CONTENT_STATUS.REMOVED]: "Removed"
} as const;

export const DASHBOARD_RANG_FILTER = {
    ALL_TIME: 0,
    LAST_DAY: 1,
    SEVEN_DAYS: 2,
    THIRTY_DAYS: 3
} as const;

export type DashboardRangFilter = typeof DASHBOARD_RANG_FILTER[keyof typeof DASHBOARD_RANG_FILTER];

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


export interface IRowLearningPath
{
    userId: number,
    email: string,
    knownLanguage: string,
    targetLanguage: string,
    name: string,
    level: number,
    chapter: number,
    createdOn: string,
    learningPathId: number,
    countExercises: number,
    status: number
}

export interface IRowExercise
{
    userId: number,
    email: string,
    knownLanguage: string,
    targetLanguage: string,
    name?: string,
    data?: string,
    exerciseTypeId: number,
    exerciseType: string,
    createdOn: string,
    learningPathId: number,
    exerciseId: number,
    status: number
}

export interface AdminGridResponse<T> {
  numOfRecords: number;
  data: T[];
}

export interface IDashboardCounters {
  contactUsRecordsTotal: number;
  logsTotal: number;
  lessonsTotal: number;
  draftLessonsTotal: number;
  exercisesTotal: number;
  usersTotal: number;
  loginsTotal: number; 
}
