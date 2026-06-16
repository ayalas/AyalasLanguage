import axios from "axios";
import { AuthHeader } from "../../components/auth/AuthHeader";
import { errorHandler } from "../../utils/utils";
import { useState } from "react";
import { Send } from "lucide-react";

export function ContactUsAuthenticatedUserPage() {
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        try {
            await axios.post('/api/profile/message', {  message });

            setError("");
            setSuccess(true);

        } catch (err) {
            errorHandler(err, setError);
        }
    };

    return (
        <>
            <AuthHeader />
            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-header">
                        <h1>Contact Us</h1>
                    </div>
                    {!success && (
                        <div className="form-row">
                            <div className="form-button-cell">
                                <button data-testid="save" type="submit" className="form-button login-button"><Send /> Send</button>
                            </div>
                        </div>
                    )}
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
                                        <textarea data-testid="message" maxLength={500} required={true} className="text-area-wide" value={message} onChange={(e) => { setMessage(e.target.value) }} />
                                    </div>
                                </div>
                            </>
                        )}
                </form>
            </div>
        </>);
}