import axios from "axios";
import { PublicHeader } from "../../components/PublicHeader";
import { errorHandler, isValidEmail } from "../../utils/utils";
import { useState } from "react";
import { Save } from "lucide-react";

export function ContactUsPublicPage() {
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
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
    };

    return (
        <>
            <PublicHeader />
            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-header">
                        <h1>Contact Us</h1>
                    </div>
                    {!success && (
                        <div className="form-row">
                            <div className="form-button-cell">
                                <button data-testid="save" type="submit" className="form-button login-button"><Save /> Save</button>
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
                                <div className="form-label-row">Email address</div>
                                <div className="form-row">
                                    <div className="form-input-row">
                                        <input type="email" data-testid="email" maxLength={128} required={true} className="form-input" value={email} onChange={(e) => { setEmail(e.target.value) }} />
                                    </div>
                                </div>
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