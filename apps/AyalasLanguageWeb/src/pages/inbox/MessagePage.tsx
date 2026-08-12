import { useEffect, useState } from "react";
import { FormHeader } from "../../components/FormHeader";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { InboxUserMessage } from "@ayalaslanguage/types/sharedfrontlib/inbox";
import axios from "axios";
import type { User } from "@ayalaslanguage/types/sharedfrontlib/user";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { errorHandler } from "@ayalaslanguage/types/error";
import { Inbox, Send, Trash } from "lucide-react";
import { AuthHeader } from "../../components/auth/AuthHeader";

dayjs.extend(utc);
dayjs.extend(timezone);

export function MessagePage() {
    const { messageId } = useParams();
    const [error, setError] = useState("");
    const [msg, setMsg] = useState<InboxUserMessage | null>(null);
    const { user, login } = useOutletContext<{ user: User | null; login: (u: User) => void }>();
    const navigate = useNavigate();

    useEffect(() => {
        async function runAsync() {
            try {
                const msg = await axios.get<InboxUserMessage>(`/api/inbox/message/${messageId}`);
                setMsg(msg.data);
                if (msg.data.readWithRequest) {
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
                                <label className="form-label">To: {msg.toUserId == user?.userId ? "Me" : msg.contactName}</label>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-label-cell">
                                <label className="form-content-row">{msg.message}</label>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-label-cell">
                                <label className="form-label">Sent: {dayjs.utc(msg.sendDate).local().format('MMM DD, YYYY HH:mm')}</label>
                            </div>
                        </div>
                        <div className="buttons-container">
                            {msg.fromUserId == user?.userId && (
                                <div className="form-button-cell">
                                    <button data-testid="delete" type="button" onClick={deleteMessage} className="form-button"><Trash /> Delete Message</button>
                                </div>
                            ) || (
                                    <div className="form-button-cell">
                                        <button data-testid="reply" type="button" onClick={() => { navigate(`/inbox/message?inResponseToMessageId=${msg.userMessageId}`) }} className="form-button"><Send /> Reply</button>
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