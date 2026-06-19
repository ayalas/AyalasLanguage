export interface IRowContactUs
{
    contactUsId: number,    
    userId?: number,
    displayName?: string,
    email: string,
    message: string,
    createdOn: string
}

export interface AdminGridResponse<T> {
  numOfRecords: number;
  data: T[];
}
