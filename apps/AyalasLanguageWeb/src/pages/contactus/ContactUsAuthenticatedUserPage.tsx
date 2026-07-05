import axios from "axios";
import { AuthHeader } from "../../components/auth/AuthHeader";
import { errorHandler } from '@ayalaslanguage/types/error';
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { handleKeyDown } from "../../utils/utils";
import { FormHeader } from "../../components/FormHeader";

export function ContactUsAuthenticatedUserPage() {
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const messageRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messageRef.current?.focus();
    }, []);

    async function submitAction() {
        try {
            await axios.post('/api/profile/message', { message });

            setError("");
            setSuccess(true);

        } catch (err) {
            errorHandler(err, setError);
        }
    }

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        await submitAction();
    };

    return (
        <>
            <AuthHeader />
            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <FormHeader isPublic={false} title="Contact Us" />
                    {error !== "" && (
                        <div className="form-row">
                            <label className="form-error">{error}</label>
                        </div>
                    )}
                    {success && (
                        <div className="form-row">
                            <h3>Message sent successfully.</h3>
                        </div>
                    ) || (
                            <>
                                <div className="form-label-row">Message</div>
                                <div className="form-row">
                                    <div className="form-input-row">
                                        <textarea ref={messageRef} data-testid="message" maxLength={4000} 
                                        required={true} className="text-area-wide" value={message} 
                                        onKeyDown={(e) => handleKeyDown(e, null, submitAction)} onChange={(e) => { setMessage(e.target.value) }} />
                                    </div>
                                </div>
                            </>
                        )}
                    {!success && (
                        <div className="buttons-container">
                            <div className="form-button-cell">
                                <button data-testid="save" type="submit" className="form-button login-button"><Send /> Send</button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </>);
}