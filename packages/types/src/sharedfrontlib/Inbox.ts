export interface PagedResponse<T> {
  numOfRecords: number;
  data: T[];
}

export interface SendMessageRequest
{
    toUserId?: number;
    learningPathId?: number;
    message: string;
    inResponseToUserMessageId?: number;
}

export interface SendMessageResponse
{
    userMessageId: number;
}

export interface InboxUserMessage
{
    userMessageId: number;
    fromUserId: number;
    fromUserName: string;
    toUserId : number;
    contactName: string;
    learningPathId?: number;
    message: string;
    learningPathName?: string;
    sendDate: string;
    readWithRequest: boolean;
}