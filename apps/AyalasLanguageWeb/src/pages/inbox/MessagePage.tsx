import { useEffect, useState } from "react";
import { FormHeader } from "../../components/FormHeader";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { InboxUserMessage } from "@ayalaslanguage/types/sharedfrontlib/inbox";
import axios from "axios";
import type { User } from "@ayalaslanguage/types/sharedfrontlib/user";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { errorHandler } from "@ayalaslanguage/types/error";
import { Inbox, Reply, Trash } from "lucide-react";
import { AuthHeader } from "../../components/auth/AuthHeader";
import { InboxMessagesComponent } from "../../components/inbox/InboxMessagesComponent";

dayjs.extend(utc);
dayjs.extend(timezone);

export function MessagePage() {
    const { messageId } = useParams();
    const [error, setError] = useState("");
    const [msg, setMsg] = useState<InboxUserMessage | null>(null);
    const { user, login } = useOutletContext<{ user: User | null; login: (u: User) => void }>();
    const navigate = useNavigate();
    const [recepient, setRecepient] = useState("");

    useEffect(() => {
        async function runAsync() {
            try {
                const tmpMsg = await axios.get<InboxUserMessage>(`/api/inbox/message/${messageId}`);
                setMsg(tmpMsg.data);

                setRecepient(tmpMsg.data.toUserId == user?.userId ? "Me" : tmpMsg.data.contactName != "" ? tmpMsg.data.contactName :
                    `Author of "${tmpMsg.data.learningPathName}"`);

                if (tmpMsg.data.readWithRequest) {
                    //reduce the number of unread messages for the user
                    const tmp: User = { ...user } as User;
                    if (tmp.unreadMessages != null && tmp.unreadMessages > 0) {
                        tmp.unreadMessages = tmp.unreadMessages - 1;
                        login(tmp);
                    }

                }
            } catch (err: unknown) {
                errorHandler(err, setError);
            }
        }
        runAsync();

    }, [messageId]);

    const deleteMessage = async () => {
        try {
            await axios.delete<InboxUserMessage>(`/api/inbox/message/${messageId}`);

            navigate('/inbox');
        } catch (err: unknown) {
            errorHandler(err, setError);
        }
    };

    return (
        <>
            <AuthHeader />
            <div className="form-container">
                <FormHeader isPublic={false} title="Message" />
                {error !== "" && (
                    <div className="form-row">
                        <label className="form-error">{error}</label>
                    </div>
                )}
                {msg != null && (
                    <>
                        <div className="form-row">
                            <div className="form-label-cell">
                                <label className="form-label">From: {msg.fromUserId == user?.userId ? "Me" : msg.fromUserName}</label>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-label-cell">
                                <label className="form-label">To: <Link to={msg.inResponseToMessageId != null ? `/inbox/${msg.inResponseToMessageId}`
                                        : `/author/path/${msg.learningPathId}`}>{recepient}</Link>{msg.inResponseToMessageId != null ? "": " (lesson)"}</label>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-input-long">
                                <textarea data-testid="message" readOnly={true} className="text-area-wide" maxLength={20000} value={msg.message} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-label-cell">
                                <label className="form-label">Sent: {dayjs.utc(msg.sendDate).local().format('MMM DD, YYYY HH:mm')}</label>
                            </div>
                        </div>
                        <InboxMessagesComponent showOnNoData={false} title="Replies" inResponseToMessageId={msg.userMessageId}  />
                        <div className="buttons-container">
                            {msg.fromUserId == user?.userId && (
                                <>
                                    <div className="form-button-cell">
                                        <button data-testid="delete" type="button" onClick={deleteMessage} className="form-button"><Trash /> Delete Message</button>
                                    </div>
                                    {msg.inResponseToMessageId != null && (
                                        <div className="form-button-cell">
                                        <button data-testid="reply-again" type="button" onClick={() => { navigate(`/inbox/message?inResponseToMessageId=${msg.inResponseToMessageId}`) }} className="form-button"><Reply /> Reply Again</button>
                                    </div>
                                    )}
                                </>
                            ) || (
                                    <div className="form-button-cell">
                                        <button data-testid="reply" type="button" onClick={() => { navigate(`/inbox/message?inResponseToMessageId=${msg.userMessageId}`) }} className="form-button"><Reply /> Reply</button>
                                    </div>
                                )}
                            <div className="form-button-cell">
                                <button data-testid="inbox" type="button" onClick={() => { navigate('/inbox') }} className="form-button"><Inbox /> Back to Inbox</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}