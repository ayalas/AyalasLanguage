import axios from "axios";
import { PublicHeader } from "../../components/PublicHeader";
import { errorHandler } from '@ayalaslanguage/types/error';
import { handleKeyDown, isValidEmail } from "../../utils/utils";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

export function ContactUsPublicPage() {
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);
    const emailRef = useRef<HTMLInputElement>(null);
    const messageRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        emailRef.current?.focus();
    }, []);

    async function submitAction () {
        try {
            if (!isValidEmail(email)) {
                setError("Please enter a valid email address");
                return;
            }

            await axios.post('/api/public/message', { email, message });

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
            <PublicHeader />
            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-header">
                        <h1>Contact Us</h1>
                    </div>
                    
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
                                <div className="form-label-row">Email address</div>
                                <div className="form-row">
                                    <div className="form-input-row">
                                        <input ref={emailRef} type="email" data-testid="email" maxLength={128} required={true} className="form-input" value={email} 
                                        onKeyDown={(e) => handleKeyDown(e, messageRef)} onChange={(e) => { setEmail(e.target.value) }} />
                                    </div>
                                </div>
                                <div className="form-label-row">Message</div>
                                <div className="form-row">
                                    <div className="form-input-row">
                                        <textarea ref={messageRef} data-testid="message" maxLength={500} required={true} className="text-area-wide" value={message} 
                                            onKeyDown={(e) => handleKeyDown(e, null, submitAction)} onChange={(e) => { setMessage(e.target.value) }} />
                                    </div>
                                </div>
                            </>
                        )}
                    {!success && (
                        <div className="buttons-container">
                            <div className="form-button-cell">
                                <button data-testid="save" type="submit" className="form-button"><Send /> Send</button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </>);
}