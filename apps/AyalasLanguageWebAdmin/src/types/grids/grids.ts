import { CONTENT_STATUS } from "@ayalaslanguage/types/exercise";
import { LOG_TYPE, type LogType } from "@ayalaslanguage/types/log";
import {JOB_STATUS, JOB_TYPE, type JobStatus, type JobType } from "@ayalaslanguage/types/job";

export const LOG_TYPE_MAPPING = {
  [LOG_TYPE.AUTO_AI_FAILURE]: "Auto AI Failure",
  [LOG_TYPE.EXERCISE_DATA_VALIDATION_FAILED]: "Exercise Validation Failure",
  [LOG_TYPE.USERS_PROGRESS_UPDATE_ON_EXERCISE_CREATE_JOB_RUN_FAILED]: "User Progress Job Failure",
} as const;

export const JOB_TYPE_MAPPING = {
  [JOB_TYPE.USERS_PROGRESS_ON_EXERCISE_CREATE]: "User Progress Job"
} as const;

export const JOB_STATUS_MAPPING = {
  [JOB_STATUS.NotStarted]: "Not Started",
  [JOB_STATUS.Running]: "Running",
  [JOB_STATUS.Stopped]: "Stopped",
  [JOB_STATUS.Completed]: "Completed",
  [JOB_STATUS.PartiallyFailed]: "Partially Failed",
  [JOB_STATUS.Failed]: "Failed"
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

export const JOB_FILTER = {
    ALL: 0,
    INCOMPLETE: 1,
    FAILED: 2,
    COMPLETED: 3
} as const;

export type JobFilter = typeof JOB_FILTER[keyof typeof JOB_FILTER];

export const JOB_FILTER_MAPPING = {
  [JOB_FILTER.ALL]: "All",
  [JOB_FILTER.INCOMPLETE]: "Incomplete",
  [JOB_FILTER.FAILED]: "Failed",
  [JOB_FILTER.COMPLETED]: "Completed"
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

export interface IRowJob
{
  jobId: number,
  mainRecordId? : number,
  secondaryRecordId? : number,
  extraData?: string,
  jobType: JobType,
  jobStatus: JobStatus, 
  createdOn: string, 
  modifiedOn: string, 
  firstError?: string,
  completed: number,
  errors: number,
  leftToProcess? : number
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
  incompleteJobsTotal: number;
  failedJobsTotal: number;
}
