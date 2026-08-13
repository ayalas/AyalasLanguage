import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { Inbox, Send } from "lucide-react";
import axios from "axios";

import { errorHandler } from "@ayalaslanguage/types/error";
import type { InboxUserMessage, SendMessageRequest, SendMessageResponse } from '@ayalaslanguage/types/sharedfrontlib/inbox';

import { FormHeader } from "../../components/FormHeader";
import { AuthHeader } from "../../components/auth/AuthHeader";
import type { LearningPathInfo } from "@ayalaslanguage/types/sharedfrontlib/learning";


export function SendMessagePage() {
    const [searchParams] = useSearchParams();
    const learningPathId = searchParams.get('learningPathId');
    const inResponseToMessageId = searchParams.get('inResponseToMessageId');
    const [messageSent, setMessageSent] = useState(false);
    const [message, setMessage] = useState("");
    const [replyingToMessage, setReplyingToMessage] = useState("");
    const [error, setError] = useState("");
    const [recepient, setRecepient] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        async function execAsync() {
            if (learningPathId != null) {
                //set recpient by lesson: protect nick name for privacy in this case
                const lesson = await axios.get<LearningPathInfo>(`/api/learning/path/${learningPathId}`)
                setRecepient(`Author of "${lesson.data.name}"`);
            }
            else if (inResponseToMessageId != null) {
                //set recpient by message
                const msg = await axios.get<InboxUserMessage>(`/api/inbox/message/${inResponseToMessageId}`)
                setRecepient(msg.data.fromUserName);
                setReplyingToMessage(msg.data.message);
            }
        }
        execAsync();
    }, [learningPathId, inResponseToMessageId])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {

            if (message.length == 0) {
                setError("Message must be filled.");
                return;
            }

            const req: SendMessageRequest = {
                message
            };

            if (inResponseToMessageId != null) {
                req.inResponseToUserMessageId = Number(inResponseToMessageId);
            }
            else if (learningPathId != null) {
                req.learningPathId = Number(learningPathId);
            }
            else {
                setError("Message must be sent in regards to a lesson or in response to another message.");
                return;
            }

            const res = await axios.post<SendMessageResponse>('/api/inbox/message',
                req);

            if (res.data?.userMessageId > 0) {
                setMessageSent(true);
            }
            else {
                setError("Unexpected result returned from server.");
                return;
            }

        } catch (err: unknown) {
            errorHandler(err, setError);
        }
    };

    return (
        <>
            <AuthHeader />
            <div className="form-container">
                <FormHeader isPublic={false} title="Send Message" />
                {messageSent ? (
                    <>
                        <div className="form-row">
                            <h3>Message sent successfully.</h3>
                        </div>
                        <div className="buttons-container">
                            <div className="form-button-cell">
                                <button data-testid="inbox" type="button" onClick={() => { navigate('/inbox') }} className="form-button"><Inbox /> Inbox</button>
                            </div>
                        </div>
                    </>
                ) :
                    (
                        <form onSubmit={handleSubmit}>
                            {error !== "" && (
                                <div className="form-row">
                                    <label className="form-error">{error}</label>
                                </div>
                            )}
                            <div className="form-row">
                                <div className="form-label-cell">
                                    <label className="form-label">Recepient: <Link to={inResponseToMessageId != null ? `/inbox/${inResponseToMessageId}`
                                        : `/author/path/${learningPathId}`}>{recepient}</Link></label>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-label-cell">
                                    <label className="form-content-row">{replyingToMessage}</label>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-input-long">
                                    <textarea data-testid="message" required={true} className="text-area-wide" maxLength={20000} value={message} onChange={(e) => { setMessage(e.target.value) }} />
                                </div>
                            </div>
                            <div className="buttons-container">
                                <div className="form-button-cell">
                                    <button data-testid="send" type="submit" className="form-button"><Send /> Send</button>
                                </div>
                            </div>
                        </form>
                    )
                }
            </div>
        </>
    );
}